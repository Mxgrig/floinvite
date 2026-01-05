# Deployment Checklist

**Time Budget**: 5 minutes for complete deploy + validation

## Pre-Deploy (Local)

- [ ] Changes committed to git: `git status` shows clean working tree
- [ ] Type check passes: `npm run build` completes without errors
- [ ] No TypeScript errors in output
- [ ] Test in browser: `npm run dev` at http://localhost:5173

## Deploy (Automated Script)

Run one command:
```bash
./deploy.sh
```

This will automatically:
- [ ] Build React app
- [ ] Validate .htaccess syntax
- [ ] Backup previous deployment
- [ ] Upload to correct directory: `/domains/floinvite.com/public_html/`
- [ ] Set file permissions (755 for dirs, 644 for files)
- [ ] Test main site: curl https://floinvite.com (expect HTTP 200)
- [ ] Test mail system: curl https://floinvite.com/floinvite-mail/login.php (expect HTTP 200)
- [ ] Report success/failure with timestamp

## Post-Deploy (Verification)

- [ ] Visit https://floinvite.com in browser - page loads without auth prompt
- [ ] No browser errors in DevTools console
- [ ] Mail login at https://floinvite.com/floinvite-mail/login.php is accessible
- [ ] Refresh page (Cmd+Shift+R) - loads from server, not cache

## Rollback (If Needed)

If deployment fails or breaks:

```bash
ssh -p 65002 u958180753@45.87.81.67 "cd ~/domains/floinvite.com/public_html && ls -t1 backups/ | head -1 | xargs -I {} cp -r backups/{} . && echo 'Rolled back'"
```

## Emergency Contacts

- **Hostinger Support**: Check cPanel if server issues
- **DNS**: Verify domain points to `/domains/floinvite.com/public_html/`
- **SSL**: Certificate valid until Nov 2026

---

**Remember**: If deploy.sh succeeds (✓), the site is safe. If it fails, nothing is deployed.
