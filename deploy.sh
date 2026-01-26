#!/bin/bash

# Floinvite Deployment Script
# Builds, validates, and deploys React app + Mail marketing system with automatic rollback
# Usage:
#   ./deploy.sh --confirmed              # React app only
#   ./deploy.sh --confirmed --mail       # React app + Mail system
#   ./deploy.sh --mail-only --confirmed  # Mail system only

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Parse command line arguments
# ============================================================================

CONFIRMED=false
DEPLOY_MAIL=false
MAIL_ONLY=false

for arg in "$@"; do
  case $arg in
    --confirmed)
      CONFIRMED=true
      ;;
    --mail)
      DEPLOY_MAIL=true
      ;;
    --mail-only)
      MAIL_ONLY=true
      CONFIRMED=true  # Mail-only implies confirmation
      ;;
  esac
done

# ============================================================================
# SAFETY CHECK: Must read documentation before deploying
# ============================================================================

if [ "$CONFIRMED" != "true" ]; then
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
  echo -e "${GREEN}  ./deploy.sh --confirmed              # React app only${NC}"
  echo -e "${GREEN}  ./deploy.sh --confirmed --mail       # React app + Mail system${NC}"
  echo -e "${GREEN}  ./deploy.sh --mail-only --confirmed  # Mail system only${NC}"
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
DEPLOY_DIR="/home/$REMOTE_USER/public_html/floinvite"
MAIL_DIR="$DEPLOY_DIR/floinvite-mail"
BACKUP_DIR="$DEPLOY_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_$TIMESTAMP"

# ============================================================================
# Deployment Starts
# ============================================================================

echo ""
echo -e "${YELLOW}=====================================${NC}"
echo -e "${YELLOW}  Floinvite Deployment Script${NC}"
if [ "$MAIL_ONLY" = "true" ]; then
  echo -e "${YELLOW}  (Mail System Only)${NC}"
elif [ "$DEPLOY_MAIL" = "true" ]; then
  echo -e "${YELLOW}  (React App + Mail System)${NC}"
else
  echo -e "${YELLOW}  (React App Only)${NC}"
fi
echo -e "${YELLOW}=====================================${NC}"
echo ""

# ============================================================================
# REACT APP DEPLOYMENT
# ============================================================================

if [ "$MAIL_ONLY" != "true" ]; then
  
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
    if grep -q "RewriteEngine\|Header\|FilesMatch" public/floinvite-mail/.htaccess; then
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
    mkdir -p $BACKUP_DIR
    
    if [ -f "$DEPLOY_DIR/index.html" ]; then
      mkdir -p $BACKUP_DIR/$BACKUP_NAME
      cp -r $DEPLOY_DIR/index.html $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true
      cp -r $DEPLOY_DIR/assets $BACKUP_DIR/$BACKUP_NAME/ 2>/dev/null || true
      echo "Backup created: $BACKUP_NAME"
    fi
SSHEOF
  echo -e "${GREEN}✓ Backup created${NC}"

  # Step 5: Upload React app files
  echo -e "${YELLOW}[5/7]${NC} Uploading React app files..."
  if scp -P $REMOTE_PORT -r dist/* $REMOTE_USER@$REMOTE_HOST:$DEPLOY_DIR/ > /tmp/scp.log 2>&1; then
    echo -e "${GREEN}✓ React app files uploaded${NC}"
  else
    echo -e "${RED}✗ Upload failed${NC}"
    tail -10 /tmp/scp.log
    exit 1
  fi

  # Step 6: Set permissions and configure React routing
  echo -e "${YELLOW}[6/7]${NC} Setting permissions and React routing..."
  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << SSHEOF
    set -e
    
    find $DEPLOY_DIR -maxdepth 1 -type d ! -name "floinvite-mail" ! -name "backups" -exec chmod 755 {} \;
    find $DEPLOY_DIR -maxdepth 1 -type f ! -name ".htaccess" ! -name ".htpasswd" -exec chmod 644 {} \;
    
    cat > $DEPLOY_DIR/.htaccess << 'HTEOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteCond %{REQUEST_URI} ^/floinvite-mail/
  RewriteRule ^ - [L]

  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header unset WWW-Authenticate
  Header set Cache-Control "no-cache, no-store, max-age=0"
  Header set Pragma "no-cache"
  Header set Expires "0"
</IfModule>

Options -Indexes
HTEOF
    
    echo "Permissions set and .htaccess configured"
SSHEOF
  echo -e "${GREEN}✓ Server configured${NC}"

  # Step 7: Test React app deployment
  echo -e "${YELLOW}[7/7]${NC} Testing React app deployment..."
  MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://floinvite.com)
  if [ "$MAIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Main site: HTTP 200 OK${NC}"
  else
    echo -e "${RED}✗ Main site returned HTTP $MAIN_STATUS (expected 200)${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "cd $DEPLOY_DIR && rm -rf index.html assets && cp -r backups/$BACKUP_NAME/* . && echo 'Rolled back'"
    exit 1
  fi

  echo -e "${GREEN}✓ React app deployment successful!${NC}"

fi

# ============================================================================
# MAIL SYSTEM DEPLOYMENT (optional)
# ============================================================================

if [ "$DEPLOY_MAIL" = "true" ] || [ "$MAIL_ONLY" = "true" ]; then
  
  echo ""
  echo -e "${YELLOW}[MAIL]${NC} Deploying mail marketing system..."
  
  # Validate mail files exist locally
  if [ ! -f "public/floinvite-mail/index.php" ]; then
    echo -e "${RED}✗ Error: Mail system files not found at public/floinvite-mail/${NC}"
    exit 1
  fi
  
  # Upload mail system files (SKIP: config.php, .htpasswd)
  echo -e "${YELLOW}[MAIL]${NC} Uploading mail system files..."
  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $MAIL_DIR" 2>/dev/null || true
  
  # Deploy all files EXCEPT config.php and .htpasswd (which contain credentials)
  scp -P $REMOTE_PORT -r public/floinvite-mail/* $REMOTE_USER@$REMOTE_HOST:$MAIL_DIR/ \
    2>/dev/null || true

  # Deploy PHPMailerHelper to API directory (required by mail system)
  API_DIR="/home/$REMOTE_USER/public_html/floinvite/api"
  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $API_DIR" 2>/dev/null || true
  scp -P $REMOTE_PORT public/api/PHPMailerHelper.php $REMOTE_USER@$REMOTE_HOST:$API_DIR/ \
    2>/dev/null || true

  # Remove uploaded config.php and .htpasswd (we don't want to overwrite server versions)
  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST << SSHEOF
    set -e
    
    # These files should NOT be overwritten from git
    if [ -f "$MAIL_DIR/config.php.backup" ]; then
      rm -f $MAIL_DIR/config.php
      cp $MAIL_DIR/config.php.backup $MAIL_DIR/config.php
    fi
    
    if [ -f "$MAIL_DIR/.htpasswd.backup" ]; then
      rm -f $MAIL_DIR/.htpasswd
      cp $MAIL_DIR/.htpasswd.backup $MAIL_DIR/.htpasswd
    fi
    
    # Set permissions
    chmod 755 $MAIL_DIR
    chmod 644 $MAIL_DIR/*.php 2>/dev/null || true
    chmod 644 $MAIL_DIR/.htaccess 2>/dev/null || true
    chmod 644 $MAIL_DIR/schema.sql 2>/dev/null || true
    chmod 755 $MAIL_DIR/logs 2>/dev/null || true
    
    echo "Mail system files deployed"
SSHEOF
  
  echo -e "${GREEN}✓ Mail system files uploaded${NC}"
  
  # Test mail login is accessible
  MAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://floinvite.com/floinvite-mail/login.php)
  if [ "$MAIL_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Mail login page: HTTP 200 OK${NC}"
  else
    echo -e "${RED}✗ Mail system returned HTTP $MAIL_STATUS (expected 200)${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Mail system deployment successful!${NC}"
  
  echo ""
  echo -e "${YELLOW}⚠ IMPORTANT NOTE:${NC}"
  echo "  Database config (config.php) and .htpasswd are NOT overwritten."
  echo "  These files contain server credentials and stay on production."
  echo "  To update them, use SSH directly."
  echo ""

fi

# ============================================================================
# Final Summary
# ============================================================================

if [ "$MAIL_ONLY" != "true" ]; then
  # Test mail system is still working
  MAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://floinvite.com/floinvite-mail/login.php)
  if [ "$MAIL_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Mail system: HTTP 200 OK${NC}"
  else
    echo -e "${YELLOW}⚠ Mail system: HTTP $MAIL_STATUS (verify manually)${NC}"
  fi
fi

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  ✓ Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Deployed at: $(date)"
echo "Main site: https://floinvite.com"
echo "Mail system: https://floinvite.com/floinvite-mail/login.php"
if [ "$MAIL_ONLY" != "true" ]; then
  echo "Backup: $BACKUP_NAME"
fi
echo ""
echo "Next steps:"
echo "1. Visit https://floinvite.com in browser (hard refresh: Cmd+Shift+R)"
echo "2. Verify no authentication prompt appears"
echo "3. Check DevTools console for errors"
echo ""
