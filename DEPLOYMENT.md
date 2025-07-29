# Deployment Configuration

## Required Environment Variables

### API Configuration
```
NEXT_PUBLIC_API_URL=http://localhost:8888  # For development
NEXT_PUBLIC_API_URL=https://your-domain.com  # For production
```

### Email Configuration (Mailgun)
```
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain.mailgun.org
HR_EMAIL=your_hr_email@company.com
ADMIN_EMAIL=your_admin_email@company.com
```

### Feature Flags
```
ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_FILE_UPLOADS=true
```

### File Upload Configuration (Optional - Netlify Blobs)
```
NETLIFY_BLOBS_URL=https://your-site.netlify.app
NETLIFY_ACCESS_TOKEN=your_netlify_access_token
```

### Security
```
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Deployment Instructions

### Netlify
1. Go to Site Settings → Environment Variables
2. Add each variable listed above
3. Deploy from your repository

### Vercel
```bash
vercel env add MAILGUN_API_KEY
vercel env add HR_EMAIL
vercel env add ADMIN_EMAIL
# Add all other variables
```

### Other Platforms
Use your platform's environment variable configuration to set all required variables.

## Security Notes
- Never commit real credentials to git
- Use HTTPS in production
- Restrict ALLOWED_ORIGINS to your actual domains
- Keep API keys secure and rotate them regularly