# Email Service Implementation

This document describes the Mailgun email service integration for the Wareworks application system.

## Overview

The email service sends application notifications to HR when a new application is submitted. It uses Mailgun via Netlify Functions to deliver emails with the application PDF attached.

## Configuration

### Environment Variables

Set these variables in your `.env.local` file:

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=sandbox83befb52fc8e44b19aa5d51bef784443.mailgun.org

# Email Recipients
HR_EMAIL=inbox@ohthatgrp.com          # Testing email
ADMIN_EMAIL=shimmy@ohthatgrp.com      # Alternative testing email

# Feature Flag
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Production Configuration

For production deployment, the system automatically switches to:
- **Recipient**: `admin@wareworks.me`
- **Sender**: `admin@wareworks.me`

## Testing

### Local Development

1. Ensure Netlify Dev is running:
   ```bash
   netlify dev
   ```

2. Run the email test script:
   ```bash
   node scripts/test-email.js
   ```

### Manual Testing

You can test the email function directly by calling the Netlify function:

```javascript
const testData = {
  to: 'inbox@ohthatgrp.com',
  subject: 'Test Application',
  text: 'This is a test email',
  attachments: [] // Optional PDF attachments
}

fetch('/.netlify/functions/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
```

## Architecture

### Components

1. **EmailService.ts** - Main service class that handles email composition and sending
2. **send-email.ts** - Netlify function that interfaces with Mailgun API
3. **submit-application route** - Calls EmailService after successful form submission

### Flow

1. User submits application form
2. Application data is validated and PDF is generated
3. EmailService is called with application data and PDF buffer
4. Email is sent via Netlify function to Mailgun API
5. HR receives email notification with PDF attachment

### Error Handling

- Network failures are logged and retried
- Malformed attachments are skipped rather than failing entirely  
- Detailed error logging for debugging
- Fallback to console logging if Mailgun is not configured

## Email Format

The notification email includes:

- **Subject**: "New Application: [First Name] [Last Name] - [Position]"
- **Body**: Formatted plain text with:
  - Applicant personal information
  - Contact details
  - Emergency contact
  - Application metadata (ID, submission time)
  - Position and salary expectations
- **Attachment**: Complete application PDF

## Security

- API keys are stored in environment variables
- Email content is sanitized
- Attachment processing includes error handling to prevent crashes
- Production/development environment separation

## Troubleshooting

### Common Issues

1. **"Email notifications disabled"**
   - Set `ENABLE_EMAIL_NOTIFICATIONS=true`

2. **"Mailgun API error: 401"**
   - Verify `MAILGUN_API_KEY` is correct
   - Check domain configuration in Mailgun dashboard

3. **"Failed to fetch CSRF token"**
   - Ensure Netlify Dev is running for local development
   - Check CORS configuration for production

4. **Attachments not working**
   - PDF generation must complete successfully first
   - Check file size limits (Mailgun has a 25MB limit)

### Debugging

Enable detailed logging by checking the Netlify function logs:

```bash
netlify dev --debug
```

Or view production logs in the Netlify dashboard under Functions.

## Monitoring

The email service logs:
- Email send attempts with recipient and subject
- Success confirmations with Mailgun message IDs
- Error details including HTTP status codes
- Configuration status (API keys, domains)

Monitor these logs to ensure reliable email delivery.