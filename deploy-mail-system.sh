#!/bin/bash
# Deploy Email Marketing System to Hostinger
# CORRECT LIVE DIRECTORY: /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/

set -e

LOCAL_MAIL_DIR="/home/grig/Projects/floinvite/public/floinvite-mail"
LIVE_MAIL_DIR="/home/u958180753/domains/floinvite.com/public_html/floinvite-mail"
SSH_HOST="u958180753@45.87.81.67"
SSH_PORT="65002"

echo "=========================================="
echo "Deploying Email Marketing System"
echo "=========================================="
echo "Source:  $LOCAL_MAIL_DIR"
echo "Target:  $LIVE_MAIL_DIR"
echo ""

# Deploy all files
scp -P $SSH_PORT -r $LOCAL_MAIL_DIR/* $SSH_HOST:$LIVE_MAIL_DIR/

echo ""
echo "✓ Files deployed successfully!"
echo ""

# Set permissions
ssh -p $SSH_PORT $SSH_HOST << 'SSH_COMMANDS'
chmod 755 /home/u958180753/domains/floinvite.com/public_html/floinvite-mail
chmod 644 /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/*.php
chmod 644 /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/*.css
chmod 755 /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/logs 2>/dev/null || true
echo "✓ Permissions set"
SSH_COMMANDS

echo ""
echo "✓ Deployment complete!"
echo ""
echo "Access email marketing at:"
echo "   https://floinvite.com/floinvite-mail/login.php"
echo ""
