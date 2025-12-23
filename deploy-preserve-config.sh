#!/bin/bash

# After running deploy.sh, this preserves critical config files
echo "Preserving config files on production server..."

scp -P 65002 public/api/env.php REDACTED_USER@REDACTED_HOST:~/domains/floinvite.com/public_html/api/
scp -P 65002 .env REDACTED_USER@REDACTED_HOST:~/domains/floinvite.com/public_html/ 2>/dev/null || echo "Note: .env not in repo (expected - exists only on server)"

echo "Config files preserved on production server"
