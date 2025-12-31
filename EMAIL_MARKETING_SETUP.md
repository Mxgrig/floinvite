# Email Marketing System - Complete Setup Checklist

**Project**: Floinvite
**Database**: u958180753_mail
**System**: Full Campaign Management + React Admin Interface
**Status**: Ready for Implementation

---

## ✅ Phase 1: Database Setup

### Step 1.1 - Create Database Tables
- [ ] Access phpMyAdmin in Hostinger cPanel
- [ ] Select database: `u958180753_mail`
- [ ] Import `public/floinvite-mail/schema.sql`
- [ ] Verify all 9 tables created:
  - [ ] subscribers
  - [ ] campaigns
  - [ ] campaign_sends
  - [ ] send_queue
  - [ ] email_opens
  - [ ] email_clicks
  - [ ] unsubscribe_log
  - [ ] rate_limit_log
  - [ ] activity_log

### Step 1.2 - Verify Database Credentials
Database credentials confirmed from Hostinger:
```
Host: localhost
User: u958180753_mail
Password: your-db-password
Database: u958180753_mail
```

---

## ✅ Phase 2: Environment Configuration

### Step 2.1 - Update .env File

The `.env.example` has been updated with all required variables.

**Location**: `/home/grig/Projects/floinvite/.env.example`

Create or update `.env` with these values:

```env
# Database
DB_HOST=localhost
DB_USER=u958180753_mail
DB_PASS=your-db-password
DB_NAME=u958180753_mail

# SMTP (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@floinvite.com
SMTP_PASS=<get-from-hostinger-email-settings>

# URLs
BASE_URL=https://floinvite.com/floinvite-mail
PUBLIC_URL=https://floinvite.com

# Rate Limiting
RATE_LIMIT_PER_HOUR=100
BATCH_SIZE=50

# Session
SESSION_TIMEOUT=3600
```

### Step 2.2 - Set Environment Variables in Hostinger

1. Go to **cPanel** → **Advanced** → **Environment Variables**
2. Add these variables:
   - `SMTP_PASS` = Your Hostinger email account password
   - `DB_PASS` = your-db-password
   - `SMTP_USER` = admin@floinvite.com

OR update `.htaccess` in `public/floinvite-mail/`:
```apache
SetEnv DB_USER u958180753_mail
SetEnv DB_PASS your-db-password
SetEnv DB_NAME u958180753_mail
SetEnv SMTP_USER admin@floinvite.com
SetEnv SMTP_PASS your-email-password
```

---

## ✅ Phase 3: File Structure & Permissions

### Step 3.1 - Verify Directory Structure
```
public/
├── floinvite-mail/               ✓ Campaign management system
│   ├── config.php                ✓ Database & SMTP config
│   ├── index.php                 ✓ Dashboard
│   ├── subscribers.php           ✓ Subscriber management
│   ├── compose.php               ✓ Campaign editor
│   ├── send.php                  ✓ Send campaigns
│   ├── track.php                 ✓ Email opens/clicks
│   ├── unsubscribe.php          ✓ Unsubscribe handling
│   ├── schema.sql                ✓ Database schema
│   ├── SETUP.md                  ✓ Setup guide
│   └── logs/                     → Create directory
├── admin-mail/                   ⚠️ Legacy (can be removed)
│   └── config.php
├── php/
│   └── send-emails.php           ⚠️ Legacy (simple send, no DB)
└── ...
```

### Step 3.2 - Create Required Directories
```bash
mkdir -p public/floinvite-mail/logs
chmod 755 public/floinvite-mail/logs
```

### Step 3.3 - Set File Permissions
```bash
chmod 644 public/floinvite-mail/*.php
chmod 755 public/floinvite-mail/logs
chmod 644 public/floinvite-mail/.htaccess
```

---

## ✅ Phase 4: Authentication & Security

### Step 4.1 - Session Configuration
The system uses PHP sessions (`$_SESSION['admin_logged_in']`).

**To add login page** (optional):
1. Create `login.php`:
   ```php
   <?php
   session_start();
   if ($_SERVER['REQUEST_METHOD'] === 'POST') {
       $username = $_POST['username'] ?? '';
       $password = $_POST['password'] ?? '';

       // Verify credentials
       if (verify_admin($username, $password)) {
           $_SESSION['admin_logged_in'] = true;
           header('Location: index.php');
       }
   }
   ?>
   ```

2. Update `config.php` `require_auth()` to check login

### Step 4.2 - Security Checklist
- [ ] Database password is secure
- [ ] SMTP credentials in environment variables only
- [ ] .env file is in .gitignore
- [ ] HTTPS enabled on https://floinvite.com
- [ ] Session timeout set to 3600 seconds (1 hour)
- [ ] Rate limiting enabled (100 emails/hour)
- [ ] Admin area behind authentication

---

## ✅ Phase 5: SMTP Configuration

### Step 5.1 - Verify Email Account

1. Go to **Hostinger** → **Email Accounts**
2. Confirm `admin@floinvite.com` exists
3. Note the email account password (for SMTP_PASS)

### Step 5.2 - Test SMTP Connection

Create `test-smtp.php`:
```php
<?php
require_once 'floinvite-mail/config.php';

$to = 'admin@floinvite.com';
$subject = 'SMTP Test';
$message = 'This is a test email from Floinvite';

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: admin@floinvite.com\r\n";

if (@mail($to, $subject, $message, $headers)) {
    echo 'Email sent successfully';
} else {
    echo 'Failed to send email';
}
?>
```

Access: `https://floinvite.com/test-smtp.php`

---

## ✅ Phase 6: Testing & Verification

### Step 6.1 - Database Connection Test

Create `test-db.php`:
```php
<?php
require_once 'public/floinvite-mail/config.php';

try {
    $db = get_db();
    $result = $db->query("SELECT COUNT(*) as count FROM subscribers");
    $count = $result->fetch()['count'];
    echo json_encode([
        'success' => true,
        'tables_status' => 'connected',
        'subscriber_count' => $count
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
```

### Step 6.2 - Admin Panel Access

1. Visit: `https://floinvite.com/floinvite-mail/index.php`
2. Should see dashboard with stats
3. Tables should show: Subscribers, Campaigns, Emails This Week, Open Rate

### Step 6.3 - Subscriber Import

1. Click "Manage Subscribers"
2. Import test CSV with columns: `email`, `name`, `company`
3. Verify subscribers appear in database

### Step 6.4 - Campaign Creation

1. Click "New Campaign"
2. Fill in: Name, Subject, From Name
3. Edit HTML template
4. Save as Draft
5. Click Send (with 3 test subscribers)
6. Verify send progress updates

### Step 6.5 - Email Delivery Test

1. Send test campaign to known email
2. Check email inbox for delivery
3. Verify SMTP logs show successful send
4. Click tracking link to verify opens work

---

## ✅ Phase 7: React Admin Interface Integration

### Step 7.1 - Frontend Components
- [ ] `AdminEmailMarketing.tsx` - Email composer with CSV upload
- [ ] `AdminRoute.tsx` - Route protection for webmaster-only access
- [ ] Integrated into `App.tsx` as `/admin/email-marketing` route

### Step 7.2 - Permission Requirements
- User must have `userRole = 'webmaster'`
- Enforced via `<AdminRoute>` component
- Falls back to landing page if unauthorized

### Step 7.3 - CSV Upload Features
- Upload CSV with email, name, company
- Preview recipients count
- Configure subject line
- Edit email template
- Send to all recipients
- View send history with success/failure counts

---

## ✅ Phase 8: Monitoring & Maintenance

### Step 8.1 - Weekly Checks
- [ ] Check failed sends: `SELECT * FROM campaign_sends WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10`
- [ ] Monitor rate limiting: `SELECT COUNT(*) FROM send_queue WHERE status = 'queued'`
- [ ] Review subscriber growth: `SELECT DATE(created_at), COUNT(*) FROM subscribers GROUP BY DATE(created_at)`

### Step 8.2 - Performance Optimization
- [ ] Archive old campaigns (>90 days)
- [ ] Clean up tracking tables (email_opens, email_clicks)
- [ ] Prune send_queue regularly

### Step 8.3 - Backup Strategy
- [ ] Weekly database backups
- [ ] Export subscriber lists
- [ ] Store encryption keys safely

---

## ✅ Phase 9: Production Deployment

### Step 9.1 - Pre-Deployment Checklist
- [ ] Database schema imported successfully
- [ ] All environment variables set
- [ ] SMTP credentials configured
- [ ] File permissions correct
- [ ] Database connection tested
- [ ] Admin login working
- [ ] Test campaign sent successfully
- [ ] Error logging configured

### Step 9.2 - Go Live
- [ ] Deploy to production server
- [ ] Update BASE_URL and PUBLIC_URL
- [ ] Enable HTTPS
- [ ] Set APP_ENV=production
- [ ] Disable DEBUG mode

### Step 9.3 - Post-Launch Monitoring
- [ ] Monitor send queue for backups
- [ ] Check error logs daily
- [ ] Track open/click rates
- [ ] Gather subscriber feedback

---

## Troubleshooting Guide

### Database Connection Failed
```
Error: "Database connection failed"

Solution:
1. Verify credentials in config.php
2. Check DB_USER, DB_PASS, DB_NAME match Hostinger
3. Ensure database exists in phpMyAdmin
4. Verify user has SELECT, INSERT, UPDATE, DELETE permissions
5. Check hostname (usually 'localhost' on shared hosting)
```

### SMTP Error
```
Error: "Failed to send email"

Solution:
1. Verify admin@floinvite.com email account exists
2. Confirm SMTP_PASS is correct (check Hostinger email settings)
3. Verify SMTP_HOST is smtp.hostinger.com
4. Check SMTP_PORT is 465 (SSL)
5. Test with simple PHP mail() function first
6. Check Hostinger email account is not suspended
```

### Permission Denied
```
Error: "Cannot write to logs directory"

Solution:
1. Create logs directory: mkdir public/floinvite-mail/logs
2. Set permissions: chmod 755 logs
3. Verify parent directory is writable: chmod 755 floinvite-mail
4. Check PHP process has write access
```

### Session Errors
```
Error: "Unauthorized" or "Session expired"

Solution:
1. Clear browser cookies
2. Close and reopen browser
3. Check SESSION_TIMEOUT in config.php
4. Verify session.save_path is writable
5. Check PHP session configuration in phpinfo()
```

### Email Not Received
```
Error: "Sent successfully but email not received"

Solution:
1. Check spam/junk folder
2. Verify email address is correct
3. Check Hostinger email logs
4. Verify bounce rate (table: campaign_sends status='bounced')
5. Test with different email provider
6. Verify email headers are formatted correctly
```

---

## System Requirements

- PHP 7.4+ (Hostinger provides 8.x)
- MySQL 5.7+ (Hostinger provides 8.x)
- PDO MySQL extension
- PHP mail() function enabled
- SMTP access to smtp.hostinger.com
- HTTPS support

---

## File Checklist

Core Files:
- [x] `public/floinvite-mail/schema.sql` - Database schema
- [x] `public/floinvite-mail/config.php` - Configuration
- [x] `public/floinvite-mail/index.php` - Dashboard
- [x] `public/floinvite-mail/subscribers.php` - Subscriber management
- [x] `public/floinvite-mail/compose.php` - Campaign editor
- [x] `public/floinvite-mail/send.php` - Campaign sender
- [x] `public/floinvite-mail/track.php` - Email tracking
- [x] `public/floinvite-mail/unsubscribe.php` - Unsubscribe handling
- [x] `public/floinvite-mail/.htaccess` - Web server config
- [x] `.env.example` - Environment variables template

React Components:
- [x] `src/components/AdminEmailMarketing.tsx` - Email composer UI
- [x] `src/components/AdminRoute.tsx` - Route protection
- [x] `src/types.ts` - TypeScript interfaces (MarketingEmail, etc.)

Documentation:
- [x] `public/floinvite-mail/SETUP.md` - Setup instructions
- [x] `EMAIL_MARKETING_SETUP.md` - This file

---

## Next Actions

1. **Immediate** (Today)
   - [ ] Import schema.sql into database
   - [ ] Update .env with credentials
   - [ ] Test database connection
   - [ ] Test SMTP configuration

2. **Short Term** (This week)
   - [ ] Create test subscriber list
   - [ ] Send test campaign
   - [ ] Verify email delivery
   - [ ] Test tracking (opens/clicks)

3. **Before Launch**
   - [ ] Set up authentication/login
   - [ ] Configure rate limiting
   - [ ] Enable monitoring
   - [ ] Create backup strategy

4. **Post-Launch**
   - [ ] Monitor send queue
   - [ ] Track open/click rates
   - [ ] Optimize delivery
   - [ ] Gather user feedback

---

## Support & Resources

**Hostinger Documentation**: https://www.hostinger.com/tutorials
**PHP Mail Function**: https://www.php.net/manual/en/function.mail.php
**Email Best Practices**: https://www.returnpath.com/
**SMTP Troubleshooting**: https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol

---

**Setup Created**: 2025-12-29
**System**: Floinvite Email Marketing
**Database**: u958180753_mail
**Status**: Ready for Implementation

---
