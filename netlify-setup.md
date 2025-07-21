# Netlify Setup Guide for WareWorks Application

## 🚀 Quick Setup (5 minutes)

### 1. Create Netlify Site

```bash
# Option A: CLI Setup (Recommended)
npm install -g netlify-cli
netlify login
netlify init

# Option B: Git Integration
# 1. Push code to GitHub
# 2. Go to netlify.com
# 3. "New site from Git" → Connect GitHub → Select repo
```

### 2. Configure Build Settings

In Netlify Dashboard or `netlify.toml`:

```toml
[build]
  base = "apps/form-app"
  command = "npm run build"
  publish = "apps/form-app/.next"

[functions]
  directory = "netlify/functions"
  node_bundler = "nft"
```

### 3. Set Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:

**Required:**
```bash
NODE_VERSION=20
NEXT_PUBLIC_API_URL=https://your-site.netlify.app
```

**Google Sheets Integration:**
```bash
ENABLE_GOOGLE_SHEETS=true
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour base64 encoded key\n-----END PRIVATE KEY-----
```

**Email Notifications:**
```bash
ENABLE_EMAIL_NOTIFICATIONS=true
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
HR_EMAIL=hr@wareworks.me
ADMIN_EMAIL=admin@wareworks.me
```

**Security:**
```bash
ALLOWED_ORIGINS=https://wareworks.me,https://apply.wareworks.me
```

### 4. Custom Domain Setup

**For `apply.wareworks.me`:**

1. **Netlify Dashboard:**
   - Site Settings → Domain Management
   - Add custom domain: `apply.wareworks.me`
   - Netlify will provide DNS instructions

2. **DNS Configuration (in your domain provider):**
   ```
   Type: CNAME
   Name: apply
   Value: your-site.netlify.app
   ```

3. **SSL Certificate:**
   - Netlify auto-provisions Let's Encrypt SSL
   - Force HTTPS redirect in Site Settings

### 5. Functions Configuration

**Enable Functions v2:**
```bash
# In netlify.toml (already configured)
[functions]
  directory = "netlify/functions"
  node_bundler = "nft"
  
# Functions will be available at:
# https://your-site.netlify.app/.netlify/functions/v2/submit-application
```

## 🔧 Advanced Configuration

### Performance Optimization

```toml
# netlify.toml additions
[build.environment]
  NODE_OPTIONS = "--max-old-space-size=4096"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Cache-Control = "no-cache"
```

### Security Headers

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://maps.googleapis.com"
```

### Redirect Rules

```toml
# Handle SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["!admin"]}

# API routing
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/v2/:splat"
  status = 200

# Legacy compatibility
[[redirects]]
  from = "/.netlify/functions/submit-application"
  to = "/.netlify/functions/v2/submit-application"
  status = 301
```

## 🔐 Google Services Setup

### Google Sheets API

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project: "wareworks-application"

2. **Enable Sheets API:**
   - APIs & Services → Library
   - Search "Google Sheets API" → Enable

3. **Create Service Account:**
   - APIs & Services → Credentials
   - Create Credentials → Service Account
   - Download JSON key file

4. **Configure Spreadsheet:**
   - Create Google Sheet for applications
   - Share with service account email (Editor access)
   - Copy Sheet ID from URL

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication** on Gmail account
2. **Generate App Password:**
   - Google Account → Security → App Passwords
   - Select "Mail" and "Other" 
   - Copy 16-character password
3. **Test Configuration:**
   ```bash
   # Use generated app password in GMAIL_APP_PASSWORD
   ```

## 📊 Monitoring & Analytics

### Netlify Analytics

```bash
# Enable in Netlify Dashboard
Site Settings → Analytics → Enable
```

### Function Logs

```bash
# View logs
netlify functions:log submit-application

# Live logs
netlify dev
```

### Google Analytics 4

```javascript
// Add to webflow-embed.html
gtag('config', 'G-XXXXXXXXXX', {
  page_title: 'WareWorks Application',
  page_location: window.location.href
});
```

## 🧪 Testing Setup

### Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local development with functions
netlify dev

# Test functions directly
curl http://localhost:8888/.netlify/functions/v2/submit-application
```

### Deploy Preview Testing

```bash
# Deploy preview branch
netlify deploy

# Deploy to production
netlify deploy --prod
```

## 🚨 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Clear cache and retry
netlify build --clear-cache
```

**Functions Timeout:**
```toml
# Increase timeout in netlify.toml
[functions]
  timeout = 30
```

**Environment Variables Not Working:**
- Check spelling and casing
- Restart deploy after changes
- Use `console.log(process.env.VAR_NAME)` to debug

**Google Sheets Connection:**
```bash
# Verify service account permissions
# Check sheet sharing settings
# Validate JSON key format
```

### Debug Commands

```bash
# Check site status
netlify status

# View build logs
netlify build

# Test functions locally
netlify functions:invoke submit-application --payload='{"test": true}'

# Check environment variables
netlify env:list
```

## 📝 Deployment Checklist

- [ ] Repository connected to Netlify
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Functions deployment working
- [ ] Google Sheets integration tested
- [ ] Email notifications tested
- [ ] Webflow embed updated with production URL
- [ ] Analytics tracking verified
- [ ] Performance monitoring enabled

## 🔗 Useful Links

- [Netlify Dashboard](https://app.netlify.com)
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Gmail SMTP Settings](https://support.google.com/a/answer/176600?hl=en)