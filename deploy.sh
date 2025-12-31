#!/bin/bash
set -e

echo "🚀 Deploying Floinvite to Hostinger..."
echo "📦 Source: dist/"
echo "🎯 Destination: u958180753@45.87.81.67:~/domains/floinvite.com/public_html/"
echo ""

# Using rsync for reliable deployment with progress
rsync -avz --delete \
  -e "ssh -p 65002" \
  dist/ \
  u958180753@45.87.81.67:~/domains/floinvite.com/public_html/

echo ""
echo "✅ Files uploaded successfully!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Create .htaccess for SPA routing with API support"
echo "2. Set file permissions"
echo "3. Test website"
echo ""
echo "Running post-deployment setup..."
echo ""

# Create .htaccess for SPA routing with API endpoint support
ssh -p 65002 u958180753@45.87.81.67 << 'SSHCMD'
cat > ~/domains/floinvite.com/public_html/.htaccess << 'HTACCESS'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Skip rewriting for actual files and directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Route API requests without extension to .php files
  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_URI} ^/floinvite-mail/ [OR]
  RewriteCond %{REQUEST_URI} ^/admin-mail/ [OR]
  RewriteCond %{REQUEST_URI} ^/php/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ $1.php [L]

  # Rewrite everything else to index.html for React routing
  RewriteRule . /index.html [L]
</IfModule>
HTACCESS

# Set permissions
chmod 755 ~/domains/floinvite.com/public_html
chmod 755 ~/domains/floinvite.com/public_html/api
chmod 755 ~/domains/floinvite.com/public_html/floinvite-mail
chmod 755 ~/domains/floinvite.com/public_html/admin-mail
chmod 644 ~/domains/floinvite.com/public_html/.htaccess
chmod 644 ~/domains/floinvite.com/public_html/api/*.php
chmod 644 ~/domains/floinvite.com/public_html/floinvite-mail/*.php
chmod 644 ~/domains/floinvite.com/public_html/admin-mail/*.php
chmod 644 ~/domains/floinvite.com/public_html/index.html
chmod 644 ~/domains/floinvite.com/public_html/*.xml
chmod 644 ~/domains/floinvite.com/public_html/*.html

echo "✅ .htaccess created and permissions set"
SSHCMD

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 Verify deployment:"
echo "   - Visit: https://floinvite.com"
echo "   - Or: https://45.87.81.67 (if domain not set up)"
echo ""
echo "🔒 Next steps:"
echo "   1. Ensure .env file on server has:"
echo "      - DB_PASS=admin@fl0invitE (for main app)"
echo "      - DB_PASS_MAIL=floinvit3_Mail# (for email marketing)"
echo "   2. Run: npm run test:api (to verify API endpoints)"
echo "   3. Test at: https://floinvite.com/api/check-operation-allowed.php"
echo ""
