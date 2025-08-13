exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Check if email notifications are enabled
  if (!process.env.ENABLE_EMAIL_NOTIFICATIONS || process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email notifications disabled' })
    }
  }

  try {
    const emailData = JSON.parse(event.body || '{}')
    
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, text' })
      }
    }

    // Debug environment variables
    console.log('🔍 Environment check:', {
      MAILGUN_API_KEY: process.env.MAILGUN_API_KEY ? `${process.env.MAILGUN_API_KEY.substring(0, 8)}...` : 'NOT SET',
      MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN || 'NOT SET',
      ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS || 'NOT SET',
      HR_EMAIL: process.env.HR_EMAIL || 'NOT SET'
    })

    // Check if Mailgun is configured
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      await sendViaMailgun(emailData)
    } else {
      // Fallback to console logging for development/when not configured
      console.log('⚠️ Mailgun not configured. Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text.substring(0, 100) + '...',
        attachments: emailData.attachments?.length || 0
      })
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' })
    }

  } catch (error) {
    console.error('Email function error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

async function sendViaMailgun(emailData) {
  // Use the same approach as our working test
  const FormData = require('form-data');
  const Mailgun = require('mailgun.js');

  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY
  });
  
  // Prepare message data
  const messageData = {
    from: `Wareworks Applications <postmaster@${process.env.MAILGUN_DOMAIN}>`,
    to: [emailData.to],
    subject: emailData.subject,
    text: emailData.text,
  };
  
  // Add attachments if provided
  if (emailData.attachments && emailData.attachments.length > 0) {
    messageData.attachment = emailData.attachments.map(att => {
      return {
        data: Buffer.from(att.content, 'base64'),
        filename: att.filename,
        contentType: att.contentType || 'application/octet-stream'
      };
    });
    
    console.log(`📎 Preparing ${emailData.attachments.length} attachments for Mailgun:`, 
      emailData.attachments.map(a => ({ name: a.filename, size: `${Math.round(a.content.length * 0.75)} bytes` })));
  }

  // Retry logic for Mailgun API calls
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);

      console.log('Email sent via Mailgun successfully:', {
        id: data.id,
        message: data.message,
        to: emailData.to,
        subject: emailData.subject,
        attachments: emailData.attachments?.length || 0,
        attempt: attempt
      });
      
      return data;
    } catch (error) {
      console.error(`Mailgun API error (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Only retry on 5xx server errors, not 4xx client errors
      const isRetryableError = error.status >= 500 || !error.status;
      
      if (attempt === maxRetries || !isRetryableError) {
        throw new Error(`Mailgun API error after ${attempt} attempts: ${error.message}`);
      }
      
      // Exponential backoff: wait longer between retries
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}