#!/usr/bin/env node

/**
 * Test script for Mailgun email functionality
 * Usage: node scripts/test-email.js
 */

// Test the email service by calling the Netlify function directly
async function testEmail() {
  const testEmailData = {
    to: 'inbox@ohthatgrp.com',
    subject: 'Test Email - Wareworks Application System',
    text: `This is a test email from the Wareworks application system.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV || 'development'}
- Mailgun Domain: ${process.env.MAILGUN_DOMAIN || 'Not configured'}

If you receive this email, the Mailgun integration is working correctly.

Best regards,
Wareworks Application System`
  }

  try {
    console.log('Testing email functionality...')
    console.log('Recipient:', testEmailData.to)
    console.log('Environment Variables:')
    console.log('- MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '✓ Set' : '✗ Not set')
    console.log('- MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || '✗ Not set')
    console.log('- ENABLE_EMAIL_NOTIFICATIONS:', process.env.ENABLE_EMAIL_NOTIFICATIONS || 'Not set')

    // For local testing, we'll use the Netlify function URL
    const functionUrl = process.env.NETLIFY_FUNCTION_URL || 'http://localhost:8888/.netlify/functions/send-email'
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log('✓ Email test successful!')
    console.log('Response:', result)

  } catch (error) {
    console.error('✗ Email test failed:')
    console.error(error.message)
    
    if (error.message.includes('fetch')) {
      console.log('\nNote: Make sure Netlify Dev is running with: netlify dev')
      console.log('Or set NETLIFY_FUNCTION_URL to point to your deployed function')
    }
    
    process.exit(1)
  }
}

// Check if required environment variables are loaded
if (!process.env.MAILGUN_API_KEY) {
  console.log('Loading environment variables from .env.local...')
  try {
    require('dotenv').config({ path: '.env.local' })
  } catch (e) {
    console.warn('Could not load dotenv (install with: npm install dotenv)')
  }
}

testEmail()