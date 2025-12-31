# Email Marketing System Setup Guide

## Database Configuration

### Credentials (from Hostinger)
```
Database Name: u958180753_mail
Database User: u958180753_mail
Password: Mail_pa55w0rd!
Host: localhost (Hostinger shared hosting)
```

## Step 1: Import Database Schema

1. **Via phpMyAdmin (Hostinger Control Panel)**:
   - Go to `cPanel` → `phpMyAdmin`
   - Select the database: `u958180753_mail`
   - Click "Import" tab
   - Upload `schema.sql` from this directory
   - Click "Go"

2. **Via Command Line** (if SSH access available):
   ```bash
   mysql -u u958180753_mail -p u958180753_mail < schema.sql
   # When prompted, enter password: Mail_pa55w0rd!
   ```

3. **Via MySQL Client**:
   ```bash
   mysql -h localhost -u u958180753_mail -p 'Mail_pa55w0rd!' u958180753_mail < schema.sql
   ```

## Step 2: Verify Database Tables

After import, verify all tables were created:

```bash
mysql -u u958180753_mail -p 'Mail_pa55w0rd!' u958180753_mail -e "SHOW TABLES;"
```

Expected tables:
- `subscribers`
- `campaigns`
- `campaign_sends`
- `send_queue`
- `email_opens`
- `email_clicks`
- `unsubscribe_log`
- `rate_limit_log`
- `activity_log`

## Step 3: Environment Variables

Create or update `.env` file in project root:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=u958180753_mail
DB_PASS=Mail_pa55w0rd!
DB_NAME=u958180753_mail

# SMTP Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@floinvite.com
SMTP_PASS=your-email-password-here

# Base URLs
BASE_URL=https://floinvite.com/floinvite-mail
PUBLIC_URL=https://floinvite.com

# Rate Limiting
RATE_LIMIT_PER_HOUR=100
BATCH_SIZE=50

# Session
SESSION_TIMEOUT=3600
```

## Step 4: Test Database Connection

Create a test file: `test-connection.php`

```php
<?php
require_once 'config.php';

try {
    $db = get_db();
    $result = $db->query("SELECT COUNT(*) as count FROM subscribers");
    $count = $result->fetch()['count'];
    echo json_encode([
        'success' => true,
        'message' => 'Database connected successfully',
        'subscribers' => $count
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
```

Access: `https://your-domain.com/floinvite-mail/test-connection.php`

## Step 5: Authentication Setup

The system uses PHP sessions. For production:

1. Create an admin user table (optional):
```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

2. Update `config.php` authentication:
```php
// In require_auth() function
// Verify against admin_users table instead of simple session check
```

## Step 6: Configure SMTP Credentials

Important: Set environment variables in Hostinger cPanel

1. Go to `cPanel` → `Advanced` → `Environment Variables`
2. Add:
   - `SMTP_USER=admin@floinvite.com`
   - `SMTP_PASS=your-hostinger-email-password`
   - `DB_PASS=Mail_pa55w0rd!`

Or update `.htaccess`:
```apache
SetEnv SMTP_USER admin@floinvite.com
SetEnv SMTP_PASS your-password
SetEnv DB_PASS Mail_pa55w0rd!
```

## Step 7: File Permissions

Ensure proper permissions for logs directory:

```bash
mkdir -p /home/grig/Projects/floinvite/public/floinvite-mail/logs
chmod 755 logs
```

## Step 8: Access the Admin Panel

- URL: `https://floinvite.com/floinvite-mail/index.php`
- Login page will prompt for credentials
- First login required to create session

## Troubleshooting

### Database Connection Error
```
Error: "Database connection failed"
- Check credentials in .env match Hostinger
- Verify database exists in phpMyAdmin
- Check user privileges (should have all on u958180753_mail.*)
```

### SMTP Error
```
Error: "Failed to send email"
- Verify SMTP_USER and SMTP_PASS in environment
- Confirm admin@floinvite.com is valid email on Hostinger
- Check email authentication is enabled
```

### File Permission Error
```
Error: "Cannot write to logs"
- Run: chmod 755 floinvite-mail/logs
- Check parent directory is writable
```

### Session Error
```
Error: "Unauthorized" or "Session expired"
- Clear browser cookies
- Check SESSION_TIMEOUT in config.php
- Verify session.save_path is writable
```

## Security Checklist

- [ ] Database password is strong (use generated one)
- [ ] SMTP credentials stored in environment variables
- [ ] .env file is in .gitignore
- [ ] Logs directory exists and is writable
- [ ] HTTPS enabled on floinvite.com
- [ ] Admin IP whitelisting configured (optional)
- [ ] Rate limiting set appropriately
- [ ] Unsubscribe mechanism functional

## Monitoring

Check system health:

```sql
-- Active campaigns
SELECT COUNT(*) FROM campaigns WHERE status IN ('draft', 'sending');

-- Pending emails
SELECT COUNT(*) FROM send_queue WHERE status = 'queued';

-- Failed sends
SELECT COUNT(*) FROM campaign_sends WHERE status = 'failed';

-- Subscriber growth
SELECT DATE(created_at) as date, COUNT(*) as new_subscribers
FROM subscribers
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;
```

## Next Steps

1. Import schema.sql into database
2. Set environment variables
3. Test database connection
4. Configure SMTP credentials
5. Access admin panel and create first campaign
6. Import subscriber list (CSV)
7. Test send with small batch
8. Monitor send queue progress

---

**Created**: 2025-12-29
**System**: Floinvite Email Marketing
**Database**: u958180753_mail
**Hosting**: Hostinger
