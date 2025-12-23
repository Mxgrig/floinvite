#!/bin/bash

# After running deploy.sh, this preserves critical config files
echo "Preserving config files on production server..."

scp -P 65002 public/api/env.php u958180753@45.87.81.67:~/domains/floinvite.com/public_html/api/
scp -P 65002 .env u958180753@45.87.81.67:~/domains/floinvite.com/public_html/ 2>/dev/null || echo "Note: .env not in repo (expected - exists only on server)"

echo "Config files preserved on production server"
