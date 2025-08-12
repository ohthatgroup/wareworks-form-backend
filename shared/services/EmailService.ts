import { ValidatedApplicationData } from '../validation/schemas'
import { PDFService } from './PDFService'

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

    // HR email - will eventually change to admins@warework.me
    const hrEmail = process.env.HR_EMAIL || 'inbox@ohthatgrp.com'
    const subject = `New Application - ${data.legalFirstName} ${data.legalLastName} - ${data.state}`

    try {
      // Prepare separate attachments for each document
      const attachments: EmailAttachment[] = []
      
      if (pdfResult) {
        if (Buffer.isBuffer(pdfResult)) {
          // Single application PDF
          attachments.push({
            filename: `${data.legalFirstName}_${data.legalLastName}_Application.pdf`,
            content: pdfResult.toString('base64'),
            contentType: 'application/pdf'
          })
          console.log(`📎 Application PDF attachment created: ${pdfResult.length} bytes`)
        } else {
          // Application PDF
          attachments.push({
            filename: `${data.legalFirstName}_${data.legalLastName}_Application.pdf`,
            content: pdfResult.applicationPDF.toString('base64'),
            contentType: 'application/pdf'
          })
          console.log(`📎 Application PDF attachment created: ${pdfResult.applicationPDF.length} bytes`)
          
          // I-9 PDF as separate attachment
          attachments.push({
            filename: `${data.legalFirstName}_${data.legalLastName}_I9_Form.pdf`,
            content: pdfResult.i9PDF.toString('base64'),
            contentType: 'application/pdf'
          })
          console.log(`📎 I-9 PDF attachment created: ${pdfResult.i9PDF.length} bytes`)
        }
      }

      // Add each uploaded document as separate attachment
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          attachments.push({
            filename: doc.name,
            content: doc.data,
            contentType: doc.mimeType
          })
          console.log(`📎 Document attachment added: ${doc.name} (${doc.mimeType})`)
        }
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

      // Use custom send-email function (more reliable than Netlify Emails plugin)
      const emailEndpoint = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/send-email`
      
      const response = await fetch(emailEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: hrEmail,
          subject: subject,
          text: this.generatePlainTextEmail(data, attachments.length),
          attachments: attachments.map(att => ({
            content: att.content,
            filename: att.filename,
            contentType: att.contentType
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

  async sendBilingualApplicationNotification(data: ValidatedApplicationData): Promise<void> {
    if (!process.env.ENABLE_EMAIL_NOTIFICATIONS || process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      console.log('Email notifications disabled')
      return
    }

    const hrEmail = process.env.HR_EMAIL || 'inbox@ohthatgrp.com'
    const subject = `New Application - ${data.legalFirstName} ${data.legalLastName} - ${data.state}`

    try {
      // Generate both English and Spanish PDFs
      const pdfService = new PDFService()
      const bilingualResult = await pdfService.generateBilingualApplicationPDF(data)
      
      // Prepare attachments
      const attachments: EmailAttachment[] = []
      
      // English PDF
      attachments.push({
        filename: `${data.legalFirstName}_${data.legalLastName}_Application_English.pdf`,
        content: bilingualResult.englishPDF.toString('base64'),
        contentType: 'application/pdf'
      })
      
      // Spanish PDF
      attachments.push({
        filename: `${data.legalFirstName}_${data.legalLastName}_Application_Spanish.pdf`,
        content: bilingualResult.spanishPDF.toString('base64'),
        contentType: 'application/pdf'
      })
      
      // I-9 PDF if exists
      if (bilingualResult.i9PDF) {
        attachments.push({
          filename: `${data.legalFirstName}_${data.legalLastName}_I9_Form.pdf`,
          content: bilingualResult.i9PDF.toString('base64'),
          contentType: 'application/pdf'
        })
      }

      // Add each uploaded document as separate attachment
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          attachments.push({
            filename: doc.name,
            content: doc.data,
            contentType: doc.mimeType
          })
          console.log(`📎 Document attachment added: ${doc.name} (${doc.mimeType})`)
        }
      }

      console.log('Preparing to send bilingual email notification:', {
        recipient: hrEmail,
        subject: subject,
        submissionId: data.submissionId,
        totalAttachments: attachments.length,
        attachmentSizes: attachments.map(a => ({ name: a.filename, size: `${Math.round(a.content.length * 0.75)} bytes` })),
        attachmentTypes: attachments.map(a => ({ name: a.filename, type: a.contentType }))
      })

      // Use custom send-email function (more reliable than Netlify Emails plugin)
      const emailEndpoint = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/send-email`
      
      const response = await fetch(emailEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: hrEmail,
          subject: subject,
          text: this.generateBilingualPlainTextEmail(data, attachments.length),
          attachments: attachments.map(att => ({
            content: att.content,
            filename: att.filename,
            contentType: att.contentType
          }))
        })
      })

      console.log('Bilingual email API response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Bilingual email send failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          endpoint: emailEndpoint
        })
        throw new Error(`Email send failed: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Bilingual email sent successfully:', {
        to: hrEmail,
        subject: subject,
        submissionId: data.submissionId,
        attachments: attachments.length,
        response: result
      })

    } catch (error) {
      console.error('Bilingual email service error details:', {
        error: error instanceof Error ? error.message : error,
        submissionId: data.submissionId,
        recipient: hrEmail,
        environment: process.env.NODE_ENV,
        mailgunConfigured: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN)
      })
      
      throw new Error(`Failed to send bilingual email notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }


  private generatePlainTextEmail(data: ValidatedApplicationData, attachmentCount: number): string {
    return `Applicant Information:
- Name: ${data.legalFirstName} ${data.legalLastName}
- Email: ${data.email}
- Phone: ${data.phoneNumber}
- Address: ${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}

Application Details:
- Submission ID: ${data.submissionId}
- Submitted: ${data.submittedAt}`
  }

  private generateBilingualPlainTextEmail(data: ValidatedApplicationData, attachmentCount: number): string {
    return `Applicant Information:
- Name: ${data.legalFirstName} ${data.legalLastName}
- Email: ${data.email}
- Phone: ${data.phoneNumber}
- Address: ${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}

Application Details:
- Submission ID: ${data.submissionId}
- Submitted: ${data.submittedAt}`
  }
}