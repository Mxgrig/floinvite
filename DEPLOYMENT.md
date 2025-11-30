# Floinvite Deployment Guide

## 🚨 CRITICAL: Domain DNS Configuration (MUST DO FIRST)

If you're using a custom domain (e.g., floinvite.com), your DNS records MUST point to the Hostinger server BEFORE deploying.

### **Check Your Current DNS Setup**

```bash
# Check where your domain currently points
nslookup floinvite.com
# or
dig floinvite.com

# Should show: 45.87.81.67 (Hostinger IP)
# If it shows Cloudflare IPs (104.21.32.116, 172.67.186.100), you need to update DNS!
```

### **If Using Cloudflare (Domain Registrar)**

**CRITICAL**: Cloudflare is just your DNS provider. Your actual hosting is on Hostinger.

1. **Login to Cloudflare Dashboard**: https://dash.cloudflare.com/
2. **Go to DNS → Records** for your domain
3. **Update A Record for `@` (main domain)**:
   - Type: A
   - Name: @
   - IPv4 Address: `45.87.81.67` (Hostinger server IP)
   - Proxy: **DNS only** (⚠️ NOT "Proxied"!)
   - TTL: Auto
4. **Update A Record for `www`**:
   - Type: A
   - Name: www
   - IPv4 Address: `45.87.81.67`
   - Proxy: **DNS only**
   - TTL: Auto
5. **Wait 5-15 minutes** for DNS propagation
6. **Verify DNS updated**:
   ```bash
   nslookup floinvite.com
   # Should now show: 45.87.81.67
   ```

**Why "DNS only" not "Proxied"?**
- ❌ **Proxied**: Cloudflare acts as reverse proxy → can cause SSL certificate conflicts with Hostinger
- ✅ **DNS only**: Direct lookup to Hostinger → clean setup with Hostinger SSL certificates

### **If Using Other Registrar (GoDaddy, Namecheap, etc.)**

1. **Login to your registrar's control panel**
2. **Find DNS/Nameservers settings**
3. **Update A record to point to Hostinger IP**: `45.87.81.67`
4. **Save changes and wait 24-48 hours for propagation**

### **Add Domain to Hostinger Account**

1. **Login to Hostinger hPanel**: https://hpanel.hostinger.com/
2. **Go to Websites → Manage**
3. **Add your domain** (if not already showing)
4. **Point domain to** `public_html` folder
5. **Enable free SSL certificate** in Hostinger
6. **Set HTTP → HTTPS redirect**

---

## **Quick Deploy to Hostinger**

### **Prerequisites** (After DNS is configured)
- ✅ DNS records point to 45.87.81.67
- ✅ Domain added to Hostinger hPanel
- ✅ SSH access to Hostinger (port 65002)
- ✅ Build completed locally (`npm run build`)

---

## **Step 1: Prepare for Deployment**

```bash
# Verify build is ready
ls -la dist/

# Expected output:
# - dist/index.html
# - dist/assets/ (CSS, JS files)
# - dist/site.webmanifest
# - dist/browserconfig.xml
```

---

## **Step 2: Connect via SSH**

```bash
ssh -p 65002 u958180753@45.87.81.67
# Enter password when prompted
```

---

## **Step 3: Navigate to Web Root**

```bash
# Check available public_html directories
ls -la ~

# For Hostinger, typically:
cd ~/public_html

# Or if you have a subdomain:
cd ~/public_html/subdomain.floinvite.com
```

---

## **Step 4: Clear Existing Files (Optional)**

```bash
# Backup existing files first
mv public_html public_html.backup

# Create fresh directory
mkdir -p public_html
cd public_html
```

---

## **Step 5: Upload Files from Local Machine**

**From your local machine (NOT on Hostinger):**

```bash
# Use SCP to upload the dist folder
scp -P 65002 -r /home/grig/Projects/floinvite/dist/* \
    u958180753@45.87.81.67:~/public_html/

# Or with SFTP:
sftp -P 65002 u958180753@45.87.81.67
# Then: put -r dist/* ./public_html/
```

---

## **Step 6: Verify File Upload**

```bash
# SSH back into Hostinger
ssh -p 65002 u958180753@45.87.81.67
cd public_html

# List files
ls -la

# Check index.html exists
cat index.html | head -20
```

---

## **Step 7: Configure Web Server (Apache)**

Create `.htaccess` for SPA routing:

```bash
cat > ~/public_html/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF
```

---

## **Step 8: Set File Permissions**

```bash
# Set correct permissions
chmod 755 ~/public_html
chmod 644 ~/public_html/*.html
chmod 644 ~/public_html/*.xml
chmod 755 ~/public_html/assets
chmod 644 ~/public_html/assets/*
```

---

## **Step 9: Test Live Website**

1. Open browser to: `https://45.87.81.67` or your domain
2. Check for:
   - ✅ Page loads without errors
   - ✅ Favicon displays
   - ✅ Responsive on mobile
   - ✅ Navigation works
   - ✅ localStorage persists data

---

## **Step 10: Domain Configuration**

If using a domain:

1. **Update DNS Records:**
   - A Record: Point to `45.87.81.67`
   - Wait 24-48 hours for DNS propagation

2. **Configure SSL (HTTPS):**
   - Hostinger usually provides free SSL
   - Enable in Hostinger control panel
   - Redirect HTTP → HTTPS

3. **Update Meta Tags:**
   - Update `index.html` to use your domain in og:url
   - Update robots.txt if needed

---

## **Common Issues & Solutions**

### **Blank Page After Upload**
```bash
# Check if index.html in public_html
ls -la ~/public_html/index.html

# Verify correct path in .htaccess
cat ~/public_html/.htaccess
```

### **404 Errors on SPA Routes**
```bash
# Ensure .htaccess is in place
cat ~/public_html/.htaccess

# Check if mod_rewrite is enabled
curl -I https://your-domain.com
```

### **localStorage Not Persisting**
- Check browser privacy settings
- Verify localStorage isn't disabled
- Test in incognito mode

### **Favicon Not Showing**
```bash
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# Or clear cache and reload

# Verify files exist
ls ~/public_html/favicon.ico
ls ~/public_html/favicon-16x16.png
```

---

## **Manual File Upload via SFTP (GUI)**

If CLI is difficult:

1. Use FileZilla or similar SFTP client
2. Connection: `45.87.81.67` port `65002`
3. Upload `/dist/*` to `/public_html/`
4. Set permissions: Right-click → Attributes
   - Files: 644
   - Folders: 755

---

## **Automated Deployment Script**

Create `deploy.sh` for future deployments:

```bash
#!/bin/bash

# Build locally
npm run build

# Upload to Hostinger
scp -P 65002 -r dist/* u958180753@45.87.81.67:~/public_html/

echo "✅ Deployment complete!"
echo "🌍 Visit: https://floinvite.com"
```

Usage:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## **Post-Deployment Checklist**

- [ ] Website loads at correct URL
- [ ] All pages accessible (landing, pricing, check-in, logbook, settings)
- [ ] localStorage works (data persists after refresh)
- [ ] Favicon displays
- [ ] Mobile responsive
- [ ] No console errors (F12 → Console)
- [ ] HTTPS working (padlock icon)
- [ ] Email compliance verified
- [ ] No PNG charts (only JavaScript charts)

---

## **Rollback if Needed**

```bash
# SSH to Hostinger
ssh -p 65002 u958180753@45.87.81.67

# Restore backup
rm -rf ~/public_html
mv ~/public_html.backup ~/public_html

echo "Rolled back to previous version"
```

---

## **Environment Variables (Phase 2+)**

When integrating email service (Phase 2):

```bash
# Create .env.production on Hostinger
cat > ~/public_html/.env.production << 'EOF'
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_KEY=re_xxxxx...
EOF
```

---

**Questions?** Check CLAUDE.md or NOTIFICATION_ROADMAP.md for more details.

Last Updated: November 30, 2024
