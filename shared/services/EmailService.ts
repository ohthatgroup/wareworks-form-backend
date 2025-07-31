import { ValidatedApplicationData } from '../validation/schemas'

interface EmailAttachment {
  filename: string
  content: string  // base64 encoded
  contentType: string
}

export class EmailService {
  async sendApplicationNotification(
    data: ValidatedApplicationData, 
    pdfResult: Buffer | { applicationPDF: Buffer; i9PDF: Buffer } | null
  ): Promise<void> {
    if (!process.env.ENABLE_EMAIL_NOTIFICATIONS || process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      console.log('Email notifications disabled')
      return
    }

    // HR email - will eventually change to admin@wareworks.me
    const hrEmail = process.env.HR_EMAIL || 'inbox@ohthatgrp.com'
    const subject = `New Application [${data.submissionId}]: ${data.legalFirstName} ${data.legalLastName} - ${data.positionApplied || 'Position Not Specified'}`

    try {
      // Prepare all attachments
      const attachments: EmailAttachment[] = []
      
      // Add PDF attachments
      if (pdfResult) {
        if (Buffer.isBuffer(pdfResult)) {
          // Single application PDF
          attachments.push({
            filename: `${data.legalFirstName}_${data.legalLastName}_Application.pdf`,
            content: pdfResult.toString('base64'),
            contentType: 'application/pdf'
          })
        } else {
          // Multiple PDFs (application + I-9)
          attachments.push({
            filename: `${data.legalFirstName}_${data.legalLastName}_Application.pdf`,
            content: pdfResult.applicationPDF.toString('base64'),
            contentType: 'application/pdf'
          })
          
          attachments.push({
            filename: `${data.legalFirstName}_${data.legalLastName}_I9_Form.pdf`,
            content: pdfResult.i9PDF.toString('base64'),
            contentType: 'application/pdf'
          })
        }
      }
      
      // Add uploaded document attachments
      if (data.documents && data.documents.length > 0) {
        data.documents.forEach((doc, index) => {
          let filename = doc.name
          
          // Add type prefix to filename for clarity
          if (doc.type === 'identification') {
            filename = `ID_${filename}`
          } else if (doc.type === 'resume') {
            filename = `Resume_${filename}`
          } else if (doc.type === 'certification') {
            filename = `Certification_${filename}`
          }
          
          attachments.push({
            filename: filename,
            content: doc.data, // Already base64 encoded
            contentType: doc.mimeType
          })
        })
      }

      console.log('Preparing to send email notification:', {
        recipient: hrEmail,
        subject: subject,
        submissionId: data.submissionId,
        totalAttachments: attachments.length,
        attachmentTypes: attachments.map(a => ({ name: a.filename, type: a.contentType }))
      })

      // Use Netlify's Email Extension (powered by Mailgun)
      const emailData = {
        to: hrEmail,
        subject: subject,
        text: this.generatePlainTextEmail(data, attachments.length),
        attachments: attachments
      }

      // Use Netlify Email Integration API
      const emailEndpoint = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/emails/application-notification`
      
      const response = await fetch(emailEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'netlify-emails-secret': process.env.NETLIFY_EMAILS_SECRET || ''
        },
        body: JSON.stringify({
          from: `WareWorks Application System <noreply@sandbox83befb52fc8e44b19aa5d51bef784443.mailgun.org>`,
          to: hrEmail,
          subject: subject,
          parameters: {
            // Required fields
            legalFirstName: data.legalFirstName,
            legalLastName: data.legalLastName,
            socialSecurityNumber: data.socialSecurityNumber,
            streetAddress: data.streetAddress,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            phoneNumber: data.phoneNumber,
            
            // Contact information  
            applicantEmail: data.email || 'Not provided',
            homePhone: data.homePhone || 'Not provided',
            aptNumber: data.aptNumber || 'Not provided',
            
            // Emergency contact
            emergencyName: data.emergencyName || 'Not provided',
            emergencyPhone: data.emergencyPhone || 'Not provided',
            emergencyRelationship: data.emergencyRelationship || 'Not provided',
            
            // Application details
            submissionId: data.submissionId,
            submittedAt: data.submittedAt,
            position: data.positionApplied || 'Not specified',
            expectedSalary: data.expectedSalary || 'Not specified',
            jobDiscovery: data.jobDiscovery || 'Not specified',
            citizenshipStatus: data.citizenshipStatus || 'Not specified',
            
            // Attachment info
            attachmentCount: attachments.length
          },
          attachments: attachments.map(att => ({
            content: att.content,
            filename: att.filename,
            type: att.contentType.split('/')[1] // 'application/pdf' -> 'pdf'
          }))
        })
      })

      console.log('Email API response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Email send failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          endpoint: emailEndpoint
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

  private generatePlainTextEmail(data: ValidatedApplicationData, attachmentCount: number): string {
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
- Citizenship Status: ${data.citizenshipStatus || 'Not specified'}

Attachments (${attachmentCount} files):
- Application PDF with all form data
- I-9 Form PDF (if citizenship requires work authorization)
- Uploaded documents (ID, resume, certifications as provided)

Please review all attached documents for complete application details.

This is an automated notification from the Wareworks application system.
    `.trim()
  }
}