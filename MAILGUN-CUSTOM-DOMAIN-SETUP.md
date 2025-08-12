# 📧 Mailgun Custom Domain Setup Guide

## Overview
This guide walks you through setting up Mailgun with a custom domain to replace the default sandbox domain.

## Current vs New Configuration

### Before (Sandbox Domain)
```bash
MAILGUN_DOMAIN=sandbox83befb52fc8e44b19aa5d51bef784443.mailgun.org
From: noreply@sandbox83befb52fc8e44b19aa5d51bef784443.mailgun.org
```

### After (Custom Domain) 
```bash
MAILGUN_DOMAIN=your_custom_domain.com
From: noreply@your_custom_domain.com
```

## Step-by-Step Setup

### Step 1: DNS Configuration

**Add these DNS records to your domain registrar (GoDaddy, Cloudflare, etc.):**

```dns
# SPF Record - Authorize Mailgun to send emails
Type: TXT
Name: mg.wareworks.me
Value: v=spf1 include:mailgun.org ~all

# DKIM Record - Digital signature for email authentication
# (You'll get the exact value from Mailgun dashboard in Step 2)
Type: TXT  
Name: krs._domainkey.mg.wareworks.me
Value: [DKIM_KEY_FROM_MAILGUN]

# CNAME for email tracking
Type: CNAME
Name: email.mg.wareworks.me  
Value: mailgun.org

# Optional: MX Records (if you want to receive emails at this domain)
Type: MX
Name: mg.wareworks.me
Value: mxa.mailgun.org (priority 10)
       mxb.mailgun.org (priority 10)
```

### Step 2: Mailgun Dashboard Setup

1. **Login to Mailgun**
   - Go to https://app.mailgun.com
   - Login with your account credentials

2. **Add New Domain**
   - Go to **Sending → Domains**
   - Click **"Add New Domain"**
   - Enter: `mg.wareworks.me`
   - Select region: **US** (recommended)

3. **Get DNS Records**
   - Copy the **DKIM record** provided by Mailgun
   - Add it to your DNS (replace `[DKIM_KEY_FROM_MAILGUN]` above)
   - Copy any other records Mailgun shows you

4. **Verify Domain**
   - Click **"Verify Domain"** in Mailgun
   - Wait for DNS propagation (5 minutes to 48 hours)
   - Status should show **"Active"** when ready

### Step 3: Update Environment Variables

**Update your `.env.local` and production environment:**

```bash
# Replace old sandbox domain
MAILGUN_DOMAIN=mg.wareworks.me
MAILGUN_API_KEY=key-your_actual_api_key_here

# Email addresses (already correct in codebase)
HR_EMAIL=hr@wareworks.me
ADMIN_EMAIL=admins@wareworks.me

# Other required variables
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Step 4: Update Production Environment

**In Netlify Dashboard:**
1. Go to **Site Settings → Environment Variables**
2. Update `MAILGUN_DOMAIN` to `mg.wareworks.me`
3. Verify `MAILGUN_API_KEY` is set correctly
4. Save changes and redeploy

**Or using Netlify CLI:**
```bash
netlify env:set MAILGUN_DOMAIN mg.wareworks.me
netlify env:set MAILGUN_API_KEY your_actual_api_key
```

### Step 5: Code Updates (Already Applied)

✅ **EmailService.ts** - Updated to use environment variable:
```typescript
from: `WareWorks Application System <noreply@${process.env.MAILGUN_DOMAIN}>`,
```

✅ **send-email.ts** - Already uses environment variables correctly

✅ **Environment references** - All updated to use custom domain

## Testing the Setup

### 1. Check DNS Propagation
```bash
# Check SPF record
nslookup -type=TXT mg.wareworks.me

# Check DKIM record  
nslookup -type=TXT krs._domainkey.mg.wareworks.me

# Check CNAME
nslookup email.mg.wareworks.me
```

### 2. Test Email Sending
```bash
# Run test script (if available)
npm run test:email

# Or submit a test application through the form
# Check logs for successful email delivery
```

### 3. Verify in Mailgun Dashboard
- Go to **Sending → Logs**
- Look for recent email sends
- Check delivery status and any bounces

## Troubleshooting

### Domain Not Verified
- **Wait longer**: DNS can take up to 48 hours
- **Check DNS**: Ensure records are added correctly
- **Contact support**: Check with your DNS provider

### Emails Not Sending
- **Check API key**: Ensure it's the correct key for your account
- **Check domain status**: Must show "Active" in Mailgun
- **Check logs**: Look at Netlify function logs and Mailgun logs
- **Check rate limits**: Sandbox has monthly limits, custom domain has higher limits

### Authentication Issues
```bash
# Common error: 401 Unauthorized
# Solution: Verify API key is correct
MAILGUN_API_KEY=key-actual_key_not_placeholder

# Common error: Domain not found
# Solution: Verify domain spelling and verification status
MAILGUN_DOMAIN=mg.wareworks.me  # Must match exactly
```

## Benefits of Custom Domain

✅ **Professional appearance**: `noreply@mg.wareworks.me` vs sandbox URL
✅ **Higher sending limits**: 10,000+ emails/month vs 300 in sandbox
✅ **Better deliverability**: Custom domains have better reputation
✅ **Brand consistency**: Matches your company domain
✅ **Production ready**: No "sandbox" in email addresses

## Post-Setup Checklist

- [ ] DNS records added and propagated
- [ ] Domain verified in Mailgun (status: Active)
- [ ] Environment variables updated
- [ ] Production deployment completed
- [ ] Test email sent successfully
- [ ] Application notification emails working
- [ ] Email logs showing successful delivery

## Support

- **Mailgun Documentation**: https://documentation.mailgun.com/
- **DNS Help**: Contact your domain registrar
- **Application Issues**: Check Netlify function logs

## Next Steps

After successful setup:
1. **Monitor email delivery** in Mailgun dashboard
2. **Set up email templates** for better formatting (optional)
3. **Configure webhooks** for bounce/complaint handling (optional)
4. **Add email analytics** tracking (optional)