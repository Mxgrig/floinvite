#!/bin/bash
set -e

echo "🚀 Deploying Floinvite to Hostinger..."
echo "📦 Source: dist/"
echo "🎯 Destination: u958180753@45.87.81.67:~/public_html/"
echo ""

# Using rsync for reliable deployment with progress
rsync -avz --delete \
  -e "ssh -p 65002" \
  dist/ \
  u958180753@45.87.81.67:~/public_html/

echo ""
echo "✅ Files uploaded successfully!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Create .htaccess for SPA routing"
echo "2. Set file permissions"
echo "3. Test website"
echo ""
echo "Running post-deployment setup..."
echo ""

# Create .htaccess for SPA routing
ssh -p 65002 u958180753@45.87.81.67 << 'SSHCMD'
cat > ~/public_html/.htaccess << 'HTACCESS'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
HTACCESS

# Set permissions
chmod 755 ~/public_html
chmod 644 ~/public_html/.htaccess
chmod 644 ~/public_html/index.html
chmod 644 ~/public_html/*.xml
chmod 644 ~/public_html/*.html

echo "✅ .htaccess created and permissions set"
SSHCMD

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 Verify deployment:"
echo "   - Visit: https://45.87.81.67"
echo "   - Or: https://floinvite.com (if DNS configured)"
echo ""
echo "🔒 Security reminder:"
echo "   - Change SSH password: ssh -p 65002 u958180753@45.87.81.67 'passwd'"
echo "   - Enable SSL: Go to Hostinger hPanel"
echo ""
