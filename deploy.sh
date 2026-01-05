#!/bin/bash

# Floinvite Deployment Script
# Builds, validates, and deploys React app with automatic rollback on failure
# Usage: ./deploy.sh --confirmed

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# SAFETY CHECK: Must read documentation before deploying
# ============================================================================

if [ "$1" != "--confirmed" ]; then
  echo ""
  echo -e "${RED}════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  ⚠ DEPLOYMENT SAFETY CHECK${NC}"
  echo -e "${RED}════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}You must read the deployment documentation before proceeding.${NC}"
  echo ""
  echo "Please read these files first:"
  echo ""
  echo -e "${BLUE}  1. DEPLOY_QUICK_START.md${NC} - 60-second overview (START HERE)"
  echo -e "${BLUE}  2. DEPLOYMENT_CHECKLIST.md${NC} - Pre-deploy checklist"
  echo -e "${BLUE}  3. DEPLOYMENT.md${NC} - Complete reference guide"
  echo ""
  echo "After reading, run with the confirmation flag:"
  echo ""
  echo -e "${GREEN}  ./deploy.sh --confirmed${NC}"
  echo ""
  echo "Why this exists:"
  echo "  • Previous deployments took 3 hours to recover from"
  echo "  • Manual edits broke production multiple times"
  echo "  • This script prevents those issues automatically"
  echo "  • But you need to understand what's happening"
  echo ""
  exit 1
fi

# ============================================================================
# Configuration
# ============================================================================

REMOTE_HOST="45.87.81.67"
REMOTE_PORT="65002"
REMOTE_USER="u958180753"
DEPLOY_DIR="/home/$REMOTE_USER/domains/floinvite.com/public_html"
BACKUP_DIR="$DEPLOY_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_$TIMESTAMP"

# ============================================================================
# Deployment Starts
# ============================================================================

echo ""
echo -e "${YELLOW}=====================================${NC}"
echo -e "${YELLOW}  Floinvite Deployment Script${NC}"
echo -e "${YELLOW}=====================================${NC}"
echo ""

# Step 1: Validate environment
echo -e "${YELLOW}[1/7]${NC} Validating environment..."
if [ ! -f "package.json" ]; then
  echo -e "${RED}✗ Error: package.json not found. Run from project root.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Project structure valid${NC}"

# Step 2: Build React app
echo -e "${YELLOW}[2/7]${NC} Building React app..."
if npm run build > /tmp/build.log 2>&1; then
  echo -e "${GREEN}✓ Build successful${NC}"
else
  echo -e "${RED}✗ Build failed. See errors above:${NC}"
  tail -20 /tmp/build.log
  exit 1
fi

# Step 3: Validate .htaccess syntax
echo -e "${YELLOW}[3/7]${NC} Validating .htaccess configuration..."
if [ -f "public/floinvite-mail/.htaccess" ]; then
  # Basic syntax check (requires mod_rewrite, mod_headers, etc.)
  if grep -q "RewriteEngine\|AuthType\|Header" public/floinvite-mail/.htaccess; then
    echo -e "${GREEN}✓ .htaccess syntax looks valid${NC}"
  else
    echo -e "${RED}✗ .htaccess missing required directives${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠ No .htaccess found to validate${NC}"
fi

# Step 4: Create backup on remote server
echo -e "${YELLOW}[4/7]${NC} Creating backup on remote server..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << SSHEOF
  set -e
  # Create backups directory if it doesn't exist
  mkdir -p $BACKUP_DIR
  
  # Backup current deployment (if it exists)
  if [ -f "$DEPLOY_DIR/index.html" ]; then
    mkdir -p $BACKUP_DIR/$BACKUP_NAME
    cp -r $DEPLOY_DIR/index.html $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true
    cp -r $DEPLOY_DIR/assets $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true
    echo "Backup created: $BACKUP_NAME"
  fi
SSHEOF
echo -e "${GREEN}✓ Backup created${NC}"

# Step 5: Upload files to server
echo -e "${YELLOW}[5/7]${NC} Uploading files to server..."
if scp -P $REMOTE_PORT -r dist/* $REMOTE_USER@$REMOTE_HOST:$DEPLOY_DIR/ > /tmp/scp.log 2>&1; then
  echo -e "${GREEN}✓ Files uploaded successfully${NC}"
else
  echo -e "${RED}✗ Upload failed${NC}"
  tail -10 /tmp/scp.log
  exit 1
fi

# Step 6: Set correct permissions and ensure proper .htaccess
echo -e "${YELLOW}[6/7]${NC} Setting permissions and configuration..."
ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << SSHEOF
  set -e
  
  # Set directory permissions
  find $DEPLOY_DIR -maxdepth 1 -type d ! -name "floinvite-mail" ! -name "backups" -exec chmod 755 {} \;
  
  # Set file permissions
  find $DEPLOY_DIR -maxdepth 1 -type f ! -name ".htaccess" ! -name ".htpasswd" -exec chmod 644 {} \;
  
  # Ensure main .htaccess exists and has no auth
  cat > $DEPLOY_DIR/.htaccess << 'HTEOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Skip rewriting for actual files and directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Exclude mail system from React routing
  RewriteCond %{REQUEST_URI} ^/floinvite-mail/
  RewriteRule ^ - [L]

  # Rewrite everything else to index.html for React routing
  RewriteRule . /index.html [L]
</IfModule>

# Clear any cached auth state
<IfModule mod_headers.c>
  Header unset WWW-Authenticate
  Header set Cache-Control "no-cache, no-store, max-age=0"
  Header set Pragma "no-cache"
  Header set Expires "0"
</IfModule>

# Prevent directory listings
Options -Indexes
HTEOF
  
  echo "Permissions set and .htaccess configured"
SSHEOF
echo -e "${GREEN}✓ Server configured${NC}"

# Step 7: Test deployment
echo -e "${YELLOW}[7/7]${NC} Testing deployment..."

# Test main site
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://floinvite.com)
if [ "$MAIN_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Main site: HTTP 200 OK${NC}"
else
  echo -e "${RED}✗ Main site returned HTTP $MAIN_STATUS (expected 200)${NC}"
  echo -e "${YELLOW}Rolling back...${NC}"
  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "cd $DEPLOY_DIR && rm -rf index.html assets && cp -r backups/$BACKUP_NAME/* . && echo 'Rolled back to previous version'"
  exit 1
fi

# Test mail system
MAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://floinvite.com/floinvite-mail/login.php)
if [ "$MAIL_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Mail system: HTTP 200 OK${NC}"
else
  echo -e "${RED}✗ Mail system returned HTTP $MAIL_STATUS (expected 200)${NC}"
  echo -e "${YELLOW}Rolling back...${NC}"
  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "cd $DEPLOY_DIR && rm -rf index.html assets && cp -r backups/$BACKUP_NAME/* . && echo 'Rolled back to previous version'"
  exit 1
fi

# Success!
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  ✓ Deployment Successful!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Deployed at: $(date)"
echo "Main site: https://floinvite.com"
echo "Mail system: https://floinvite.com/floinvite-mail/login.php"
echo "Backup: $BACKUP_NAME"
echo ""
echo "Next steps:"
echo "1. Visit https://floinvite.com in browser (hard refresh: Cmd+Shift+R)"
echo "2. Verify no authentication prompt appears"
echo "3. Check DevTools console for errors"
echo ""
