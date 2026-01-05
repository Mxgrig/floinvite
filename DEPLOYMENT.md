# Floinvite Deployment Guide

**Deployment Time**: 5 minutes (including validation and testing)

## Quick Start

**Three deployment options:**

```bash
# React app only (default)
npm run build
./deploy.sh --confirmed

# React app + Mail marketing system
npm run build
./deploy.sh --confirmed --mail

# Mail system only (no React build needed)
./deploy.sh --mail-only --confirmed
```

---

## What the Deploy Script Does

### 1. **Validation** (Local)
- Checks project structure
- Builds React app with `npm run build` (if deploying React)
- Validates .htaccess syntax

### 2. **Backup** (Remote)
- Creates timestamped backup of previous deployment
- Stored in `/domains/floinvite.com/public_html/backups/`
- Automatic rollback if anything fails
- Mail system backed up before changes

### 3. **Deploy** (Remote)
- **React App**: Uploads built files, configures SPA routing
- **Mail System**: Uploads PHP files, preserves credentials (config.php, .htpasswd)
- Sets proper file permissions (755 dirs, 644 files)
- Tests both systems after deploy

### 4. **Test** (Remote)
- HTTP 200 check on main site
- HTTP 200 check on mail login page
- Automatic rollback if tests fail

---

## Before You Deploy

**Every time:**
```bash
git status                   # Working tree must be clean
npm run build              # No TypeScript errors (if deploying React)
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

### Scenario 1: Deploy React App Changes
```bash
# 1. Make code change, test locally
# 2. Commit and push
git add .
git commit -m "[FEATURE]: Description"
git push origin feature/branch-name

# 3. Build and deploy
npm run build
./deploy.sh --confirmed

# 4. Verify in browser
# - Hard refresh: Cmd+Shift+R or Ctrl+Shift+R
# - Check console for errors
```

### Scenario 2: Deploy React App + Mail System Together
```bash
# When you have changes to both React app AND mail marketing system

# 1. Make both sets of changes
# 2. Test locally
# 3. Commit and push
git add .
git commit -m "[FEATURE]: React app + Mail system updates"
git push

# 4. Build and deploy both
npm run build
./deploy.sh --confirmed --mail

# 5. Verify both systems work
# - https://floinvite.com (hard refresh)
# - https://floinvite.com/floinvite-mail/login.php
```

### Scenario 3: Deploy Mail System Only (No React Changes)
```bash
# When you only changed mail system PHP files

# 1. Make mail system changes in public/floinvite-mail/
# 2. Test locally (if possible)
# 3. Commit and push
git add public/floinvite-mail/
git commit -m "[MAIL]: Updated email templates or features"
git push

# 4. Deploy mail system only (no React build)
./deploy.sh --mail-only --confirmed

# 5. Verify mail login works
# - https://floinvite.com/floinvite-mail/login.php
```

### Scenario 4: Rollback After Deployment
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

### Scenario 5: Update Mail System Credentials
Mail system credentials (database password, SMTP config) are stored in `config.php` and are NOT overwritten by deploy script:

```bash
# To update mail system credentials, use SSH directly:
ssh -p 65002 u958180753@45.87.81.67 << 'EOF'
nano /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/config.php
# Edit database/SMTP credentials
# Save and exit
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
./deploy.sh --confirmed    # Try again
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

### Mail system deployment skipped credentials
**Expected behavior**: config.php and .htpasswd are preserved on server
**Reason**: These files contain database passwords and email credentials
**To update them**: Use SSH to edit directly (see Scenario 5 above)

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
├── floinvite-mail/              # PHP mail marketing system
│   ├── index.php                # Mail admin dashboard
│   ├── login.php                # Mail login page
│   ├── compose.php              # Campaign composer
│   ├── config.php               # Database config (NOT overwritten)
│   ├── .htaccess                # Mail system config
│   ├── .htpasswd                # Mail credentials (NOT overwritten)
│   └── logs/                    # Mail system logs
└── backups/                     # Auto-created by deploy script
    └── backup_TIMESTAMP/
        ├── index.html
        └── assets/
```

### File Preservation
These files are **NOT overwritten** during mail system deployment:
- `config.php` - Database credentials and SMTP settings
- `.htpasswd` - Mail system login credentials

This prevents accidental loss of production secrets.

### Permissions
- Directories: 755 (rwxr-xr-x)
- Files: 644 (rw-r--r--)
- Config files: Blocked at Apache level (<Files> directives)

---

## Deploy Script Behavior

### On Success ✓ (React App Only)
```
[1/7] Validating environment...
✓ Project structure valid
[2/7] Building React app...
✓ Build successful
[3/7] Validating .htaccess...
✓ .htaccess syntax looks valid
[4/7] Creating backup...
✓ Backup created
[5/7] Uploading React app files...
✓ React app files uploaded
[6/7] Setting permissions and React routing...
✓ Server configured
[7/7] Testing React app deployment...
✓ Main site: HTTP 200 OK
✓ Mail system: HTTP 200 OK

=====================================
  ✓ Deployment Complete!
=====================================
```

### On Success ✓ (React App + Mail System)
```
[Same as above, plus:]

[MAIL] Deploying mail marketing system...
[MAIL] Uploading mail system files...
✓ Mail system files uploaded
✓ Mail login page: HTTP 200 OK

⚠ IMPORTANT NOTE:
  Database config (config.php) and .htpasswd are NOT overwritten.
  These files contain server credentials and stay on production.
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
- **Credential Preservation**: Production credentials (database password, SMTP settings) are protected
- **CORS Headers**: Mail system allows cross-origin requests from https://floinvite.com
- **SSL/TLS**: All traffic must use HTTPS
- **No Overwrites**: Deploy script never overwrites `config.php` or `.htpasswd`

---

## Deployment Modes Reference

| Command | What Deploys | Build Required? | Backup Created? |
|---------|--------------|-----------------|-----------------|
| `./deploy.sh --confirmed` | React app only | Yes | Yes |
| `./deploy.sh --confirmed --mail` | React app + Mail system | Yes | Yes |
| `./deploy.sh --mail-only --confirmed` | Mail system only | No | No |

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

### For React App Changes:
- [ ] Code changes tested locally
- [ ] `npm run build` succeeds with no errors
- [ ] Committed and pushed to git
- [ ] `git status` shows clean working tree
- [ ] SSH connection works: `ssh -p 65002 u958180753@45.87.81.67 "echo ok"`
- [ ] Run: `./deploy.sh --confirmed`

### For Mail System Changes:
- [ ] Mail PHP files tested/reviewed
- [ ] No credentials in git (only on server)
- [ ] Committed and pushed to git
- [ ] `git status` shows clean working tree
- [ ] Run: `./deploy.sh --mail-only --confirmed`

### For Both Changes:
- [ ] React app tested locally
- [ ] Mail system changes reviewed
- [ ] All committed and pushed
- [ ] `git status` shows clean working tree
- [ ] Run: `./deploy.sh --confirmed --mail`

---

**Last Updated**: Jan 5, 2026
**Script Version**: 2.0 (with mail system support)
**Next Review**: After 5 successful deployments
