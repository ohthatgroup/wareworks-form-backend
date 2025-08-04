# WareWorks Application - Quick Deployment Reference

> **📚 For comprehensive deployment instructions, see [netlify-setup.md](./netlify-setup.md)**

## 🚀 Quick Production Deployment

### Required Environment Variables

**Core Configuration:**
```bash
NODE_VERSION=20
NEXT_PUBLIC_API_URL=https://apply.wareworks.me
ALLOWED_ORIGINS=https://wareworks.me,https://apply.wareworks.me
```

**Feature Flags:**
```bash
ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_FILE_UPLOADS=true
```

**Email Service (Mailgun):**
```bash
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=apply.wareworks.me
HR_EMAIL=hr@wareworks.me
ADMIN_EMAIL=admins@warework.me
```

### Netlify Deployment Steps

1. **Connect Repository** to Netlify
2. **Build Settings** (auto-detected):
   - Base directory: `apps/form-app`
   - Build command: `npm ci && npm run build`
   - Publish directory: `.next`
3. **Environment Variables**: Add all variables above
4. **Custom Domain**: Configure `apply.wareworks.me`
5. **Deploy**: Push to main branch

### Post-Deployment Checklist

- [ ] Site accessible at custom domain
- [ ] HTTPS redirect working
- [ ] Form submission functional
- [ ] PDF generation working
- [ ] Email notifications sent
- [ ] File uploads working

## 🔗 Documentation Links

- **[Complete Setup Guide](./netlify-setup.md)** - Full deployment instructions
- **[Development Setup](./DEVELOPMENT-SETUP.md)** - Local development guide
- **[Component Documentation](./COMPONENTS-DOCUMENTATION.md)** - Frontend components
- **[Implementation Status](./TODO-IMPLEMENTATIONS.md)** - Pending features

## 🚨 Security Notes

- Never commit credentials to git
- Use environment variables for all API keys
- Restrict ALLOWED_ORIGINS to actual domains
- Enable HTTPS in production