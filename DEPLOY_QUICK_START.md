# Deploy Quick Start (60 Seconds)

## The Problem That Just Happened
- Small changes took 3 hours to deploy
- Manual edits kept breaking the site
- No validation or rollback capability
- Every change risked production downtime

## The Solution
**One command deploys everything safely:**

```bash
./deploy.sh --confirmed
```

This script:
- ✓ Builds React app
- ✓ Validates configuration
- ✓ Backs up previous version
- ✓ Uploads files
- ✓ Tests the site
- ✓ Rolls back if anything fails

## How to Deploy (Every Time)

### Step 1: Verify locally (1 minute)
```bash
git status                 # Must be clean
npm run build             # No errors?
```

### Step 2: Deploy (4 minutes)
```bash
./deploy.sh --confirmed
```

### Step 3: Verify in browser (1 minute)
- Go to https://floinvite.com
- Hard refresh: Cmd+Shift+R
- Check DevTools console for errors
- Done!

## Total Time: 5 Minutes

---

## Three Deployment Options

**React app only:**
```bash
./deploy.sh --confirmed
```

**React app + Mail marketing system:**
```bash
./deploy.sh --confirmed --mail
```

**Mail system only (no React build):**
```bash
./deploy.sh --mail-only --confirmed
```

---

## What Changed Today

| File | Purpose |
|------|---------|
| `deploy.sh` | Bulletproof deployment script |
| `DEPLOYMENT.md` | Complete deployment guide |
| `DEPLOYMENT_CHECKLIST.md` | Quick pre-deploy checklist |
| `DEPLOY_QUICK_START.md` | This file |

---

## If Something Goes Wrong

### Deploy failed with error message?
The script automatically rolled back. Check the error, fix it, try again.

### Site shows auth prompt?
Hard refresh: Cmd+Shift+R (or Ctrl+Shift+R on Windows)

### Need to rollback manually?
```bash
ssh -p 65002 u958180753@45.87.81.67 << 'EOF'
cd /home/u958180753/domains/floinvite.com/public_html
ls -lh backups/                    # See available backups
cp -r backups/backup_TIMESTAMP/* . # Restore one
EOF
```

---

## Mail System Notes

Mail system credentials (database password, SMTP settings) in `config.php` are **protected** - they never get overwritten by the deploy script. This prevents accidental credential loss.

To update mail credentials:
```bash
ssh -p 65002 u958180753@45.87.81.67 \
  "nano /home/u958180753/domains/floinvite.com/public_html/floinvite-mail/config.php"
```

---

## Never Again
- ❌ Manual .htaccess edits
- ❌ Wrong deployment directories
- ❌ 3-hour debugging sessions
- ❌ Unvalidated changes
- ❌ Conflicting deploy scripts

- ✓ Automated, tested deploys
- ✓ Automatic backups
- ✓ Instant rollback
- ✓ 5-minute turnaround
- ✓ Single deployment script

---

**Remember**: If `./deploy.sh --confirmed` succeeds, your site is live and safe.

For details: Read `DEPLOYMENT.md`
