import { ValidatedApplicationData } from '../validation/schemas'

export class EmailService {
  async sendApplicationNotification(data: ValidatedApplicationData, pdfBuffer: Buffer | null): Promise<void> {
    if (!process.env.ENABLE_EMAIL_NOTIFICATIONS || process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      console.log('Email notifications disabled')
      return
    }

    // Use testing emails for development/staging, production email for production
    const hrEmail = process.env.NODE_ENV === 'production' 
      ? 'admin@wareworks.me'
      : process.env.HR_EMAIL || 'inbox@ohthatgrp.com'
    const subject = `New Application: ${data.legalFirstName} ${data.legalLastName} - ${data.positionApplied}`

    try {
      console.log('Preparing to send email notification:', {
        recipient: hrEmail,
        subject: subject,
        submissionId: data.submissionId,
        hasAttachment: !!pdfBuffer
      })

      // Use Netlify's Email Extension (powered by Mailgun)
      const emailData = {
        to: hrEmail,
        subject: subject,
        text: this.generatePlainTextEmail(data),
        attachments: pdfBuffer ? [{
          filename: `${data.legalFirstName}_${data.legalLastName}_Application.pdf`,
          content: pdfBuffer.toString('base64'),
          contentType: 'application/pdf'
        }] : []
      }

      // Call Netlify Email function
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Email send failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        throw new Error(`Email send failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Email sent successfully:', {
        to: hrEmail,
        subject: subject,
        submissionId: data.submissionId,
        response: result
      })

    } catch (error) {
      console.error('Email service error details:', {
        error: error instanceof Error ? error.message : error,
        submissionId: data.submissionId,
        recipient: hrEmail,
        environment: process.env.NODE_ENV,
        mailgunConfigured: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN)
      })
      
      throw new Error(`Failed to send email notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private generatePlainTextEmail(data: ValidatedApplicationData): string {
    return `
New Employment Application Received

Applicant Information:
- Name: ${data.legalFirstName} ${data.legalLastName}
- Position: ${data.positionApplied}
- Email: ${data.email}
- Phone: ${data.phoneNumber}
- Address: ${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}

Emergency Contact:
- Name: ${data.emergencyName}
- Phone: ${data.emergencyPhone}
- Relationship: ${data.emergencyRelationship}

Application Details:
- Submission ID: ${data.submissionId}
- Submitted: ${data.submittedAt}
- Expected Salary: ${data.expectedSalary || 'Not specified'}
- How they found the job: ${data.jobDiscovery || 'Not specified'}

Please review the attached PDF for complete application details.

This is an automated notification from the Wareworks application system.
    `.trim()
  }
}