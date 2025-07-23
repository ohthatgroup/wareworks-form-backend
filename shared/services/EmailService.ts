import { ValidatedApplicationData } from '../types'

export class EmailService {
  async sendApplicationNotification(data: ValidatedApplicationData, pdfBuffer: Buffer | null): Promise<void> {
    if (!process.env.ENABLE_EMAIL_NOTIFICATIONS || process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      console.log('Email notifications disabled')
      return
    }

    const hrEmail = process.env.HR_EMAIL || 'hr@wareworks.me'
    const subject = `New Application: ${data.legalFirstName} ${data.legalLastName} - ${data.positionApplied}`

    try {
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
        throw new Error(`Email send failed: ${response.status} ${response.statusText}`)
      }

      console.log('Email sent successfully to:', hrEmail)

    } catch (error) {
      console.error('Email service error:', error)
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

export class PDFService {
  async generateApplicationPDF(data: ValidatedApplicationData): Promise<Buffer> {
    if (!process.env.ENABLE_PDF_GENERATION || process.env.ENABLE_PDF_GENERATION !== 'true') {
      throw new Error('PDF generation disabled')
    }

    try {
      // TODO: Implement actual PDF generation
      // For now, just create a simple placeholder
      console.log('Would generate PDF for:', data.submissionId)
      
      // Return a simple buffer as placeholder
      return Buffer.from(`PDF placeholder for ${data.submissionId}`)

    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}