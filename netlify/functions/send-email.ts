import { Handler } from '@netlify/functions'

interface EmailData {
  to: string
  subject: string
  text: string
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
  }>
}

export const handler: Handler = async (event, context) => {
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
    const emailData: EmailData = JSON.parse(event.body || '{}')
    
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, text' })
      }
    }

    // For simple setup, we'll use Netlify's built-in email capabilities
    // If MAILGUN_API_KEY is set, use Mailgun directly
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      await sendViaMailgun(emailData)
    } else {
      // Fallback to console logging for development
      console.log('Email would be sent:', {
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

async function sendViaMailgun(emailData: EmailData) {
  const formData = new FormData()
  formData.append('from', `Wareworks Application System <noreply@${process.env.MAILGUN_DOMAIN}>`)
  formData.append('to', emailData.to)
  formData.append('subject', emailData.subject)
  formData.append('text', emailData.text)

  // Add attachments if present
  if (emailData.attachments) {
    for (const attachment of emailData.attachments) {
      const buffer = Buffer.from(attachment.content, 'base64')
      const blob = new Blob([buffer], { type: attachment.contentType })
      formData.append('attachment', blob, attachment.filename)
    }
  }

  const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`
    },
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mailgun API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log('Email sent via Mailgun:', result.id)
}