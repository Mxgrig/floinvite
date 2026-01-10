# Email SMTP Configuration Issue - Session 20260110

## Problem
Emails not sending with authentication error 535: "authentication failed (reason unavailable)"

## Root Cause
The SMTP password configured in `.env` (`admin@fl0invitE`) does not match the actual password for `campaigns@floinvite.com` on Hostinger.

## Solution Implemented
1. Switched from port 465 to port 587 (STARTTLS is more standard)
2. Simplified PHPMailerHelper to properly handle STARTTLS negotiation
3. Fixed syntax error in cron comment that prevented PHP parsing

## Files Changed
- `.env`: Changed SMTP_PORT from 465 to 587
- `public/api/PHPMailerHelper.php`: Rewritten with proper STARTTLS support

## Next Action Required
**User must update SMTP password in `.env`:**

1. Log in to Hostinger Control Panel (cpanel.hostinger.com or similar)
2. Navigate to: Email → Email Accounts (or Mail section)
3. Find the account: `campaigns@floinvite.com`
4. Look for SMTP/Mail password settings
5. Copy the actual SMTP password
6. Update `.env`:
   ```
   SMTP_USER=campaigns@floinvite.com
   SMTP_PASS=<actual-password-from-hostinger>
   ```
7. Redeploy to Hostinger

## Testing
Created diagnostic script at: `public/floinvite-mail/test-email-queue.php`

Can be accessed via: `https://floinvite.com/floinvite-mail/test-email-queue.php`

## Technical Notes
- Hostinger often provides different passwords for web login vs SMTP
- Port 587 (STARTTLS) is more universally supported than 465
- Current error message confirms connection works, just credentials are wrong
