# Email Marketing System - Quick Start Guide

## 30-Second Overview

**What**: Full email marketing system with campaign management + React admin UI
**Where**: `public/floinvite-mail/` (backend) + React component (frontend)
**Database**: `u958180753_mail` on Hostinger
**Status**: Schema ready, config complete, needs DB import

---

## The 5-Minute Setup

### 1. Import Database Schema (2 min)
```bash
# Via phpMyAdmin:
1. Go to Hostinger cPanel → phpMyAdmin
2. Select u958180753_mail database
3. Click "Import" tab
4. Upload: public/floinvite-mail/schema.sql
5. Click Go

# OR via command line:
mysql -u u958180753_mail -p u958180753_mail < public/floinvite-mail/schema.sql
# Password: your-db-password
```

### 2. Set Environment Variables (1 min)
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and set:
DB_HOST=localhost
DB_USER=u958180753_mail
DB_PASS=your-db-password
DB_NAME=u958180753_mail
SMTP_USER=admin@floinvite.com
SMTP_PASS=your-hostinger-email-password
```

### 3. Test Connection (1 min)
```bash
# Access admin panel:
https://floinvite.com/floinvite-mail/index.php

# Should see dashboard with 0 subscribers, 0 campaigns
```

### 4. Create Test Data (1 min)
```bash
# Visit: https://floinvite.com/floinvite-mail/subscribers.php
# Click: Import Subscribers
# Upload CSV with columns: email, name, company
```

---

## Database Credentials

```
Host: localhost
Database: u958180753_mail
User: u958180753_mail
Password: your-db-password
```

### Database Tables
- `subscribers` - Email list
- `campaigns` - Campaign drafts
- `campaign_sends` - Individual send records
- `send_queue` - Batch processing queue
- `email_opens` - Tracking pixels
- `email_clicks` - Link clicks
- `unsubscribe_log` - Unsubscribe requests
- `rate_limit_log` - Rate limit tracking
- `activity_log` - Admin activity

---

## System Architecture

```
React Admin (Frontend)
├── AdminEmailMarketing.tsx
│   ├── Upload CSV
│   ├── Configure email
│   └── Preview & send
└── AdminRoute.tsx (webmaster-only)

PHP Backend (public/floinvite-mail/)
├── config.php (DB & SMTP)
├── index.php (Dashboard)
├── subscribers.php (Manage list)
├── compose.php (Create campaign)
├── send.php (Queue & send)
├── track.php (Open/click tracking)
└── unsubscribe.php (Unsubscribe handler)

Database (MySQL)
└── u958180753_mail
    ├── subscribers (list)
    ├── campaigns (drafts)
    ├── campaign_sends (sent emails)
    └── email_opens/clicks (tracking)
```

---

## How It Works

### 1. Upload Subscribers
```
CSV file (email, name, company)
  ↓
subscribers.php
  ↓
INSERT into `subscribers` table
```

### 2. Create Campaign
```
HTML template + subject
  ↓
compose.php
  ↓
INSERT into `campaigns` table as 'draft'
```

### 3. Send Campaign
```
Click "Send Campaign"
  ↓
send.php creates campaign_sends records
  ↓
Adds to send_queue for batch processing
  ↓
PHP mail() sends each email
  ↓
Updates status: pending → sent/failed
```

### 4. Track Results
```
Track pixel in email
  ↓
track.php records open
  ↓
Link clicks trigger same tracking
```

### 5. Unsubscribe
```
Click unsubscribe link
  ↓
unsubscribe.php processes request
  ↓
Updates subscriber status to 'unsubscribed'
```

---

## Common Tasks

### Import Subscriber List
```
1. Go to: https://floinvite.com/floinvite-mail/subscribers.php
2. Click: "Import List"
3. Upload CSV (email, name, company)
4. Verify count and click Import
```

### Create New Campaign
```
1. Go to: https://floinvite.com/floinvite-mail/compose.php
2. Name: "Summer Sale"
3. Subject: "50% Off This Weekend Only"
4. From: "Floinvite Marketing"
5. Edit HTML template
6. Click "Save Draft"
```

### Send Campaign
```
1. Dashboard → Recent Campaigns
2. Click campaign name
3. Review subject and recipients count
4. Click "Start Sending Campaign"
5. Monitor progress on send page
```

### View Results
```
1. Dashboard → Stats
2. Active Subscribers: Total list size
3. Emails This Week: Recent sends
4. Open Rate: Average engagement
5. Click campaign for detailed stats
```

---

## API Endpoints (if needed for React)

All handled via HTML forms. For API access, add:

```php
// In compose.php, add API endpoint:
if (!empty($_GET['api'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'campaigns' => $campaigns,
        'stats' => $stats
    ]);
    exit;
}
```

---

## React Component Integration

```typescript
// In App.tsx:
import { AdminEmailMarketing } from './components/AdminEmailMarketing';
import { AdminRoute } from './components/AdminRoute';

// In routing:
case 'admin/email-marketing':
  return (
    <AdminRoute userRole={userRole} requiredRole="webmaster">
      <AdminEmailMarketing />
    </AdminRoute>
  );
```

### Access Control
- Only users with `userRole='webmaster'` can access
- Falls back to landing page if unauthorized
- Checks user role on component mount

---

## Configuration Files

### config.php (Backend)
```php
// Database
define('DB_HOST', 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'u958180753_mail');
define('DB_PASS', getenv('DB_PASS') ?: 'your-db-password');
define('DB_NAME', getenv('DB_NAME') ?: 'u958180753_mail');

// SMTP
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USER', getenv('SMTP_USER') ?: 'admin@floinvite.com');
define('SMTP_PASS', getenv('SMTP_PASS') ?: '');

// Rate limiting
define('RATE_LIMIT_PER_HOUR', 100);
define('BATCH_SIZE', 50);
```

### .env (Environment)
```env
DB_HOST=localhost
DB_USER=u958180753_mail
DB_PASS=your-db-password
DB_NAME=u958180753_mail
SMTP_USER=admin@floinvite.com
SMTP_PASS=your-password
RATE_LIMIT_PER_HOUR=100
```

---

## Debugging Checklist

### Email Not Sent
- [ ] Database connected (check subscribers table has data)
- [ ] SMTP credentials correct (test with simple PHP mail())
- [ ] Email account exists (admin@floinvite.com)
- [ ] Rate limit not exceeded (check send_queue)
- [ ] No permission errors in error logs

### Database Error
- [ ] Database exists: u958180753_mail
- [ ] User exists: u958180753_mail
- [ ] Password correct: your-db-password
- [ ] Tables created (run schema.sql)
- [ ] User has permissions (check with phpMyAdmin)

### Campaign Not Showing
- [ ] Subscribers imported (check subscribers table)
- [ ] Campaign created (check campaigns table)
- [ ] Campaign status is 'draft' not 'sending'
- [ ] No permission errors (check logs/)

### Subscriber List Not Loading
- [ ] Database table exists: subscribers
- [ ] CSV columns correct: email, name, company
- [ ] No duplicate emails
- [ ] File size not too large (>1000 rows)

---

## Performance Tips

1. **Rate Limiting**: Set to 100 emails/hour to avoid Hostinger throttling
2. **Batch Size**: Process 50 emails at a time
3. **Cleanup**: Archive campaigns >90 days old
4. **Indexes**: Database schema includes indexes on common queries
5. **Sessions**: Set timeout to 3600 seconds (1 hour)

---

## Security Considerations

- Passwords stored in environment variables (never in code)
- SMTP_PASS never committed to git
- .env file in .gitignore
- Session timeout prevents hijacking
- Email validation before sending
- SQL prepared statements prevent injection
- Rate limiting prevents abuse

---

## Next Steps

1. **Import schema.sql**
   ```bash
   mysql -u u958180753_mail -p u958180753_mail < public/floinvite-mail/schema.sql
   ```

2. **Update .env**
   ```bash
   # Copy from .env.example
   # Add SMTP_PASS from Hostinger email settings
   ```

3. **Test Connection**
   ```
   Visit: https://floinvite.com/floinvite-mail/index.php
   Should see: Dashboard with 0 subscribers, 0 campaigns
   ```

4. **Import Test Subscribers**
   ```
   Create test.csv:
   email,name,company
   john@example.com,John Doe,Acme Corp
   jane@example.com,Jane Smith,Tech Inc
   ```

5. **Create Test Campaign**
   ```
   Name: Test Campaign
   Subject: Hello {{name}}!
   From: Floinvite
   Send to 2 test subscribers
   ```

6. **Monitor Results**
   ```
   Check dashboard for:
   - 2 recipients sent
   - Email delivery status
   - Open rate (if clicked)
   ```

---

## File Locations

```
/home/grig/Projects/floinvite/
├── public/
│   ├── floinvite-mail/           ← Email system
│   │   ├── schema.sql            ← Run this first
│   │   ├── config.php            ← Update SMTP_PASS
│   │   ├── index.php             ← Dashboard
│   │   ├── subscribers.php       ← Manage list
│   │   ├── compose.php           ← Create campaign
│   │   ├── send.php              ← Send campaign
│   │   ├── track.php             ← Track opens/clicks
│   │   └── SETUP.md              ← Detailed setup
│   ├── php/
│   │   └── send-emails.php       ← Legacy (optional)
│   └── admin-mail/               ← Legacy (can remove)
├── src/
│   ├── components/
│   │   ├── AdminEmailMarketing.tsx  ← React admin UI
│   │   └── AdminRoute.tsx           ← Route protection
│   └── types.ts                     ← TS interfaces
├── .env                          ← Create from .env.example
├── .env.example                  ← Updated with DB config
└── EMAIL_MARKETING_SETUP.md      ← Complete guide
```

---

## Support

For issues, check:
1. `public/floinvite-mail/logs/activity.log` - Server logs
2. Browser console (F12) - JavaScript errors
3. `EMAIL_MARKETING_SETUP.md` - Troubleshooting section
4. Database via phpMyAdmin - Table contents

---

**Setup Date**: 2025-12-29
**System**: Floinvite Email Marketing
**Status**: Ready to import and test
**Time to Deploy**: ~15 minutes (after credentials)
