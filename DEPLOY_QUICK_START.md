# Deploy Quick Start (60 Seconds)

## The Problem That Just Happened
- Small changes took 3 hours to deploy
- Manual edits kept breaking the site
- No validation or rollback capability
- Every change risked production downtime

## The Solution
**One command deploys everything safely:**

```bash
./deploy.sh
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
./deploy.sh
```

### Step 3: Verify in browser (1 minute)
- Go to https://floinvite.com
- Hard refresh: Cmd+Shift+R
- Check DevTools console for errors
- Done!

## Total Time: 5 Minutes

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

## Never Again
- ❌ Manual .htaccess edits
- ❌ Wrong deployment directories
- ❌ 3-hour debugging sessions
- ❌ Unvalidated changes

- ✓ Automated, tested deploys
- ✓ Automatic backups
- ✓ Instant rollback
- ✓ 5-minute turnaround

---

**Remember**: If `./deploy.sh` succeeds, your site is live and safe.
