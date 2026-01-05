# Deployment Guide

## Overview
Floinvite has two separate deployment systems:

1. **Main React App** → `/domains/floinvite.com/public_html/`
2. **Email Marketing System** → `/domains/floinvite.com/public_html/floinvite-mail/`

## Deploy Main App
```bash
npm run build
./deploy.sh
```

**Target:** `/home/u958180753/domains/floinvite.com/public_html/`

---

## Deploy Email Marketing System ⭐
```bash
./deploy-mail-system.sh
```

**Source:** `/home/grig/Projects/floinvite/public/floinvite-mail/`

**Target:** `/home/u958180753/domains/floinvite.com/public_html/floinvite-mail/`

**Access:**
```
https://floinvite.com/floinvite-mail/login.php
```

---

## ⚠️ IMPORTANT
**ALWAYS use deploy scripts** - they deploy to the CORRECT live directory.

Live site path: `/home/u958180753/domains/floinvite.com/public_html/`
NOT: `/home/u958180753/public_html/` (old/incorrect)

---

## Latest Features (Deployed)
- ✓ Professional branded footers
- ✓ Email recipient selection (subscribers/CSV/manual)
- ✓ Save & Continue to Send workflow
- ✓ Token-based prefill security
- ✓ Email templates with preview
- ✓ Test email functionality
