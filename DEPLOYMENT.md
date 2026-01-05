# Floinvite Deployment Guide

**Deployment Time**: 5 minutes (including validation and testing)

## Quick Start

```bash
npm run build          # Verify build works locally
./deploy.sh            # Deploy to production
```

That's it. The script handles everything else.

---

## What the Deploy Script Does

### 1. **Validation** (Local)
- Checks project structure
- Builds React app with `npm run build`
- Validates .htaccess syntax

### 2. **Backup** (Remote)
- Creates timestamped backup of previous deployment
- Stored in `/domains/floinvite.com/public_html/backups/`
- Automatic rollback if anything fails

### 3. **Deploy** (Remote)
- Uploads built files to correct directory
- Sets proper file permissions (755 dirs, 644 files)
- Configures .htaccess for React SPA routing

### 4. **Test** (Remote)
- HTTP 200 check on main site
- HTTP 200 check on mail system
- Automatic rollback if tests fail

---

## Before You Deploy

**Every time:**
```bash
git status                   # Working tree must be clean
npm run build              # No TypeScript errors
```

**Test locally:**
```bash
npm run dev                # Load http://localhost:5173
# Click through main flows
# Check DevTools console for errors
```

---

## Deployment Targets

| Component | Location | Access |
|-----------|----------|--------|
| React App | `/domains/floinvite.com/public_html/` | https://floinvite.com |
| Mail System | `/domains/floinvite.com/public_html/floinvite-mail/` | https://floinvite.com/floinvite-mail/login.php |
| Backups | `/domains/floinvite.com/public_html/backups/` | SSH only |

**Important**: The domain points to `/domains/floinvite.com/public_html/`, NOT `/public_html/`.

---

## Common Scenarios

### Scenario 1: Deploy a Code Change
```bash
# 1. Make code change, test locally
# 2. Commit and push
git add .
git commit -m "[FEATURE]: Description"
git push origin feature/branch-name

# 3. Deploy
./deploy.sh

# 4. Verify in browser
# - Hard refresh: Cmd+Shift+R or Ctrl+Shift+R
# - Check console for errors
```

### Scenario 2: Rollback After Deployment
If something breaks after deploy and you need to revert:

```bash
ssh -p 65002 u958180753@45.87.81.67 << 'EOF'
cd /home/u958180753/domains/floinvite.com/public_html

# List available backups
ls -lh backups/

# Rollback to specific backup (replace TIMESTAMP)
cp -r backups/backup_TIMESTAMP/* .

echo "Rolled back to backup_TIMESTAMP"
EOF
```

### Scenario 3: Deploy Mail System Only
The mail system files (PHP, database config) are NOT managed by this deploy script. To deploy mail system changes:

```bash
ssh -p 65002 u958180753@45.87.81.67 << 'EOF'
cd /home/u958180753/domains/floinvite.com/public_html/floinvite-mail

# Make changes or upload files
# Then restart PHP session
touch index.php

echo "Mail system updated"
EOF
```

---

## Troubleshooting

### Site shows auth prompt after deploy
**Cause**: Browser cached old auth state
**Fix**: Hard refresh browser
- Windows/Linux: `Ctrl+Shift+R`
- Mac: `Cmd+Shift+R`
- Or: Open in private/incognito window

### Deploy script fails with "Build failed"
**Cause**: TypeScript errors in code
**Fix**:
```bash
npm run build              # See full error
# Fix errors in code
npm run build              # Verify it works
./deploy.sh                # Try again
```

### Deploy script fails with "Upload failed"
**Cause**: SSH/SCP connection issue
**Fix**:
```bash
# Test SSH connection
ssh -p 65002 u958180753@45.87.81.67 "echo 'Connected'"

# If that fails, check:
# 1. VPN/firewall is allowing port 65002
# 2. SSH key is loaded: ssh-add ~/.ssh/id_rsa
# 3. No Hostinger firewall blocking the connection
```

### Deploy script fails with "Test returned HTTP XXX"
**Cause**: Server configuration issue
**Fix**: Script automatically rolls back. Check:
```bash
# View recent backup
ls -lh ~/domains/floinvite.com/public_html/backups/

# Check .htaccess is correct
ssh -p 65002 u958180753@45.87.81.67 \
  "cat ~/domains/floinvite.com/public_html/.htaccess"

# Check index.html exists
ssh -p 65002 u958180753@45.87.81.67 \
  "ls -lh ~/domains/floinvite.com/public_html/index.html"
```

### Mail login returns 404
**Cause**: Mail system files not deployed or permissions wrong
**Fix**:
```bash
ssh -p 65002 u958180753@45.87.81.67 << 'EOF'
# Check files exist
ls -lh /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/

# Check permissions
chmod 644 /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/*.php
chmod 755 /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/logs/

# Test
curl -I https://floinvite.com/floinvite-mail/login.php
EOF
```

---

## Infrastructure Details

### Server Configuration
- **Host**: Hostinger (45.87.81.67)
- **SSH Port**: 65002
- **User**: u958180753
- **Domain**: floinvite.com
- **SSL**: Valid until Nov 2026

### Directory Structure
```
/home/u958180753/domains/floinvite.com/public_html/
├── index.html                    # React app entry point
├── .htaccess                     # Apache routing config
├── assets/                       # JS, CSS bundles
├── floinvite-mail/              # PHP mail system
│   ├── index.php                # Mail admin dashboard
│   ├── login.php                # Mail login page
│   ├── config.php               # Database config (RESTRICTED)
│   └── .htaccess                # Mail system config
└── backups/                     # Auto-created by deploy script
    └── backup_TIMESTAMP/
        ├── index.html
        └── assets/
```

### Permissions
- Directories: 755 (rwxr-xr-x)
- Files: 644 (rw-r--r--)
- Config files: Blocked at Apache level (<Files> directives)

---

## Deploy Script Behavior

### On Success ✓
```
[1/7] Validating environment...
✓ Project structure valid
[2/7] Building React app...
✓ Build successful
[3/7] Validating .htaccess...
✓ .htaccess syntax looks valid
[4/7] Creating backup...
✓ Backup created
[5/7] Uploading files...
✓ Files uploaded successfully
[6/7] Setting permissions...
✓ Server configured
[7/7] Testing deployment...
✓ Main site: HTTP 200 OK
✓ Mail system: HTTP 200 OK

=====================================
  ✓ Deployment Successful!
=====================================
```

### On Failure ✗
```
[5/7] Uploading files...
✗ Upload failed
[ROLLBACK] Restoring previous version...
✓ Rolled back to backup_20260105_183000
```

---

## Security Notes

- **Config Files**: `.htaccess` blocks access to `config.php`, `.env`, `.htpasswd`
- **HTTP Basic Auth**: Removed from main site (used only for mail system if configured)
- **CORS Headers**: Mail system allows cross-origin requests from https://floinvite.com
- **SSL/TLS**: All traffic must use HTTPS

---

## When to NOT Use This Script

The deploy script handles **React app changes only**.

For **PHP mail system changes**:
- Deploy files manually via SSH/SCP
- Update database config directly
- Restart PHP if needed

For **DNS/SSL/server changes**:
- Use Hostinger cPanel directly
- Contact Hostinger support

---

## Getting Help

### If deploy fails:
1. Check error message from script
2. See "Troubleshooting" section above
3. If still stuck: Review deploy logs

### To verify deployment:
```bash
# Check main site
curl -I https://floinvite.com

# Check mail system
curl -I https://floinvite.com/floinvite-mail/login.php

# View recent backups
ssh -p 65002 u958180753@45.87.81.67 \
  "ls -lh ~/domains/floinvite.com/public_html/backups/ | tail -5"
```

---

## Deployment Checklist (Before You Deploy)

- [ ] Code changes tested locally
- [ ] `npm run build` succeeds with no errors
- [ ] Committed and pushed to git
- [ ] `git status` shows clean working tree
- [ ] SSH connection works: `ssh -p 65002 u958180753@45.87.81.67 "echo ok"`

---

**Last Updated**: Jan 5, 2026
**Script Version**: 1.0
**Next Review**: After 5 successful deployments
