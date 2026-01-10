# Floinvite Mail System Deployment Fixes - Jan 6 2026

## Critical Issues Fixed

### 1. Root Domain 401 Error (HIGHEST PRIORITY)
**Problem**: Main site (https://floinvite.com) showing 401 Unauthorized
**Root Cause**: LiteSpeed applies .htpasswd globally, ignoring file-level `<Files>` restrictions
**Fix**: Removed global `<RequireAny>` BasicAuth block from public/floinvite-mail/.htaccess
**Commit**: d57671f - "Fix: Remove global BasicAuth from mail .htaccess to unblock root domain"
**Verified**: curl shows HTTP 200, site loads correctly

### 2. Resume Campaign 500 Error
**Problem**: Clicking "Resume Sending" returns 500 error
**Root Cause**: `requeue_cancelled_sends()` tried INSERT duplicate send_id (primary key violation)
**Fix**: Changed to UPDATE existing rows instead of INSERT...SELECT
**Commit**: 287136b - "Fix: requeue_cancelled_sends() UPDATE instead of INSERT"
**Impact**: Allows paused campaigns to be resumed without database errors

### 3. Missing Stylesheet on send.php
**Problem**: send.php lacks CSS styling (inconsistent with compose.php, index.php)
**Root Cause**: Missing `<link rel="stylesheet" href="styles.css">` in HTML head
**Fix**: Added stylesheet link to send.php HTML head
**Commit**: 08e7fdd - "Add styles.css link to send.php for consistent styling"
**Result**: Consistent UI across all mail system pages

### 4. Resume/Send Now Process Immediately
**Problem**: "Resume" and "Send Now" buttons process emails immediately without user review
**Root Cause**: Actions called `process_campaign_queue()` directly instead of redirecting
**Fix**: Changed both to redirect to compose.php for user to review/change options
**Commits**: e7e26ba - "Fix: Redirect resume/send_now actions back to compose.php"
**Benefit**: Prevents accidental email sends with wrong send method/schedule

## Feature Added (Commit 2e4834f)
- Resume paused campaigns
- Send Now (immediate batch processing)
- Resume & Send Now (combined action)
- Auto-requeue of cancelled emails when resuming

## Technical Details

### LiteSpeed .htaccess Behavior
- Global auth blocks in .htaccess ARE applied to entire directory
- `<Files>` directive restrictions are NOT respected by LiteSpeed
- Solution: Use PHP session auth instead of .htaccess BasicAuth
- Never rely on file-level auth restrictions with LiteSpeed

### Database: requeue_cancelled_sends()
OLD (broken):
```sql
INSERT INTO send_queue (...) SELECT ... WHERE status = 'failed'
-- Error: Duplicate send_id primary key
```

NEW (working):
```sql
UPDATE send_queue SET status = 'queued', attempts = 0 WHERE status = 'failed'
-- Updates existing rows, respects constraints
```

### Mail System Auth Current State
- No .htaccess BasicAuth (removed due to LiteSpeed limitations)
- PHP sessions handle authentication
- Public endpoints: track.php, unsubscribe.php (require `Require all granted`)
- Admin endpoints: login.php, compose.php, index.php, etc. (protected by require_auth() PHP function)

## Files Changed
1. public/floinvite-mail/.htaccess (removed auth blocks)
2. public/floinvite-mail/send.php (fixed requeue, added stylesheet, redirect fix)
3. public/floinvite-mail/compose.php (status messages on redirect)
4. public/floinvite-mail/api-process-queue.php (updated send_method check)
5. public/floinvite-mail/process-queue.php (updated send_method check)

## Deployment Status
✅ All commits pushed to GitHub main branch
✅ All files deployed to Hostinger via scp
✅ Root domain: HTTP 200 OK
✅ Mail system: Loading correctly
✅ No syntax errors (verified with `php -l`)

## Important Constraints
- User: No hPanel configuration (avoid VirtualHost-level auth settings)
- User: Deployments must not break existing code
- User: Prefer direct fixes over complex multi-layer solutions
- System: LiteSpeed limitations with .htaccess BasicAuth

## Recovery if Issues Resurface
1. Check if .htaccess has `<RequireAny>` or `Require valid-user` blocks
2. Verify send.php line 817: `<link rel="stylesheet" href="styles.css">`
3. Test: `ssh -p 65002 u958180753@45.87.81.67 "curl -s https://floinvite.com -I | head -3"`
4. Check database: send_queue for constraint violations
