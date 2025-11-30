# Floinvite Pre-Deployment Verification Checklist

Use this checklist to verify everything is correctly configured BEFORE deploying to Hostinger.

---

## ✅ Phase 1: Local Build Verification

- [ ] **Build succeeds without errors**
  ```bash
  npm run build
  # Expected output: ✅ Build complete, dist/ folder created (316KB)
  ```

- [ ] **dist/ folder contains all required files**
  ```bash
  ls -la dist/
  # Should show: index.html, assets/, site.webmanifest, browserconfig.xml
  ```

- [ ] **No TypeScript errors** (non-blocking for build, but verify)
  ```bash
  npm run type-check
  # Note: Some errors are OK, build still works with `npm run build`
  ```

---

## ✅ Phase 2: Domain & Hosting Configuration (CRITICAL)

### 2A: DNS Records Configuration

- [ ] **Verify current DNS records**
  ```bash
  nslookup floinvite.com
  # OR
  dig floinvite.com

  # Current status: Points to Cloudflare IPs (104.21.32.116, 172.67.186.100)
  # Target status: Should point to 45.87.81.67 (Hostinger)
  ```

- [ ] **Update Cloudflare DNS Records**
  1. [ ] Login to https://dash.cloudflare.com/
  2. [ ] Go to DNS → Records
  3. [ ] Change A record for `@` (main domain):
     - [ ] Type: A
     - [ ] Name: @
     - [ ] IPv4: 45.87.81.67
     - [ ] Proxy: **DNS only** (NOT Proxied)
  4. [ ] Change A record for `www`:
     - [ ] Type: A
     - [ ] Name: www
     - [ ] IPv4: 45.87.81.67
     - [ ] Proxy: **DNS only**
  5. [ ] Wait 5-15 minutes for propagation

- [ ] **Verify DNS propagation completed**
  ```bash
  nslookup floinvite.com
  # Should show: 45.87.81.67

  # If still showing Cloudflare IPs:
  # - Clear DNS cache: ipconfig /flushdns (Windows) or sudo dscacheutil -flushcache (Mac)
  # - Wait another 5-10 minutes
  # - Check again
  ```

### 2B: Hostinger Account Configuration

- [ ] **Domain added to Hostinger**
  1. [ ] Login to https://hpanel.hostinger.com/
  2. [ ] Go to Websites → Manage
  3. [ ] Verify floinvite.com is listed
  4. [ ] Domain points to public_html folder

- [ ] **SSL Certificate enabled**
  1. [ ] Go to website settings
  2. [ ] Find SSL/TLS section
  3. [ ] Enable free SSL certificate (provided by Hostinger)
  4. [ ] Wait for activation (usually 5-15 minutes)

- [ ] **HTTP → HTTPS redirect configured**
  1. [ ] In Hostinger settings, find Redirects section
  2. [ ] Set all HTTP traffic to redirect to HTTPS
  3. [ ] Verify redirect is active

- [ ] **public_html folder is ready**
  ```bash
  ssh -p 65002 u958180753@45.87.81.67
  ls -la ~
  # Should show: public_html directory exists
  ```

---

## ✅ Phase 3: Hostinger Server Access

- [ ] **SSH credentials work**
  ```bash
  ssh -p 65002 u958180753@45.87.81.67
  # Should connect without errors
  # Password: fl0invite55H!
  ```

- [ ] **Verify server has Apache with mod_rewrite**
  ```bash
  ssh -p 65002 u958180753@45.87.81.67
  apache2ctl -M | grep rewrite
  # Should show: rewrite_module (shared)
  ```

- [ ] **Check available disk space**
  ```bash
  df -h
  # Should show plenty of free space (100+ MB)
  ```

---

## ✅ Phase 4: Pre-Deployment Requirements

- [ ] **Email verification complete**
  - [ ] Only admin@floinvite.com is used in project
  - Run verification: `grep -r "@" src/ | grep -v "admin@floinvite.com"`
  - Should return empty (no other emails)

- [ ] **Chart verification complete**
  - [ ] No PNG chart images in project
  - [ ] All charts use Recharts (JavaScript-based)
  - Run verification: `grep -r "\.png" src/`
  - Should return empty (no PNG references in code)

- [ ] **Environment variables configured**
  - [ ] `.env.production` file exists
  - [ ] Contains required variables:
    - `VITE_APP_URL=https://floinvite.com`
    - `VITE_BUSINESS_NAME=Floinvite`
    - `VITE_NOTIFICATION_EMAIL=admin@floinvite.com`

---

## ✅ Phase 5: Final Pre-Deployment Check

### 5A: DNS & Domain Status
- [ ] DNS records verified: `nslookup floinvite.com` shows `45.87.81.67`
- [ ] Cloudflare set to "DNS only" mode (not "Proxied")
- [ ] Domain added to Hostinger
- [ ] SSL certificate enabled
- [ ] HTTP → HTTPS redirect active

### 5B: Build & Code Quality
- [ ] `npm run build` succeeds
- [ ] dist/ folder exists with all files
- [ ] No console errors in dist/index.html
- [ ] Email addresses verified (admin@floinvite.com only)
- [ ] No PNG charts (all JavaScript)

### 5C: Hostinger Access
- [ ] SSH connection works
- [ ] Apache mod_rewrite enabled
- [ ] public_html folder exists
- [ ] Disk space available

---

## 🚨 Critical Blockers (Must Fix Before Deploying)

| Item | Status | Action |
|------|--------|--------|
| DNS points to 45.87.81.67 | ❌ BLOCKER | Update Cloudflare DNS records |
| Domain added to Hostinger | ⏳ Pending | Add domain in hPanel |
| SSL certificate enabled | ⏳ Pending | Enable in Hostinger settings |
| SSH access working | ✅ Ready | Confirmed working |
| Build succeeds | ✅ Ready | npm run build passed |

---

## 📋 Deployment Sequence (After All Checks Pass)

Once all items above are ✅, proceed with:

1. **Wait for DNS propagation**: `nslookup floinvite.com` → 45.87.81.67
2. **Upload files**: `scp -P 65002 -r dist/* u958180753@45.87.81.67:~/public_html/`
3. **Create .htaccess**: SSH in and create .htaccess for SPA routing
4. **Set permissions**: chmod 755 directories, 644 files
5. **Test website**: Open https://floinvite.com in browser
6. **Verify functionality**: Check all pages load, localStorage works
7. **Change SSH password**: For security (must do!)
8. **Enable monitoring**: Check server logs for errors

---

## 🆘 Troubleshooting

### DNS Still Shows Cloudflare IPs After Update
```bash
# Clear local DNS cache
# Windows:
ipconfig /flushdns

# Mac:
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Linux:
sudo systemctl restart systemd-resolved
```

### Domain Shows Blank Page
- [ ] Verify .htaccess file exists in public_html
- [ ] Check .htaccess content with: `cat ~/public_html/.htaccess`
- [ ] Verify Apache error logs: `tail -50 ~/logs/error.log`

### SSL Certificate Not Showing
- [ ] Wait 15-30 minutes after enabling
- [ ] Force refresh in browser: Ctrl+Shift+R
- [ ] Clear browser cache
- [ ] Check Hostinger SSL settings - may need to reissue certificate

### Cannot Connect via SSH
- [ ] Verify IP: 45.87.81.67
- [ ] Verify port: 65002
- [ ] Verify username: u958180753
- [ ] Check password is correct: fl0invite55H!
- [ ] Try from different terminal/network

---

## ✅ All Clear - Ready to Deploy!

When all items are checked ✅, you're ready to deploy:

```bash
# From your local machine
scp -P 65002 -r dist/* u958180753@45.87.81.67:~/public_html/

# Verify upload
ssh -p 65002 u958180753@45.87.81.67 "ls -la ~/public_html/"

# Test website
# Open https://floinvite.com in browser
```

---

**Last Updated**: November 30, 2024
**Status**: Awaiting DNS configuration and domain setup
