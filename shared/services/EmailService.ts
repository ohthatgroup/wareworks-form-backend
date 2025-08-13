import { ValidatedApplicationData } from '../validation/schemas'
import { PDFService } from './PDFService'
import JSZip from 'jszip'

interface EmailAttachment {
  filename: string
  content: string  // base64 encoded
  contentType: string
}

export class EmailService {
  private async createUserDocumentsZip(data: ValidatedApplicationData): Promise<EmailAttachment | null> {
    if (!data.documents || data.documents.length === 0) {
      return null
    }

    try {
      const zip = new JSZip()
      
      // Add each user document to the ZIP
      for (const doc of data.documents) {
        // Convert base64 to binary for JSZip
        const binaryData = Buffer.from(doc.data, 'base64')
        zip.file(doc.name, binaryData)
        console.log(`📦 Added to ZIP: ${doc.name} (${doc.mimeType})`)
      }

      // Generate ZIP file with maximum compression
      const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 } // Maximum compression
      })

      const originalSize = data.documents.reduce((sum, doc) => sum + Buffer.from(doc.data, 'base64').length, 0)
      const compressionRatio = Math.round((1 - zipBuffer.length / originalSize) * 100)
      
      console.log(`📦 ZIP created: ${zipBuffer.length} bytes (${compressionRatio}% compression from ${originalSize} bytes)`)

      return {
        filename: `${data.legalFirstName}_${data.legalLastName}_Documents.zip`,
        content: zipBuffer.toString('base64'),
        contentType: 'application/zip'
      }
    } catch (error) {
      console.error('Failed to create user documents ZIP:', error)
      return null
    }
  }
  private async fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
    const baseDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Attempting email send (${attempt}/${maxRetries})...`)
        
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000) // 30 second timeout
        })
        
        // If successful or non-retryable error (4xx), return immediately
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response
        }
        
        // 5xx errors are retryable
        if (response.status >= 500 && attempt < maxRetries) {
          console.log(`⚠️ Received ${response.status} error, retrying...`)
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.log(`⏳ Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        return response
        
      } catch (error) {
        console.error(`❌ Email send attempt ${attempt}/${maxRetries} failed:`, error)
        
        if (attempt === maxRetries) {
          throw error
        }
        
        // Exponential backoff for network errors, timeouts, etc.
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ Network error, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts`)
  }

  async sendApplicationNotification(
    data: ValidatedApplicationData, 
    pdfResult: Buffer | null
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
        // Unified application PDF (includes I-9 form)
        attachments.push({
          filename: `${data.legalFirstName}_${data.legalLastName}_Application.pdf`,
          content: pdfResult.toString('base64'),
          contentType: 'application/pdf'
        })
        console.log(`📎 Unified application PDF attachment created: ${pdfResult.length} bytes (includes I-9 form)`)
      }

      // Add user documents as a single ZIP attachment (preserves originals)
      const userDocumentsZip = await this.createUserDocumentsZip(data)
      if (userDocumentsZip) {
        attachments.push(userDocumentsZip)
        console.log(`📦 User documents ZIP attachment added: ${userDocumentsZip.filename}`)
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

      // Use custom send-email function with retry logic for reliability
      const emailEndpoint = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/send-email`
      
      const response = await this.fetchWithRetry(emailEndpoint, {
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
      }, 3)

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

  private logMemoryUsage(step: string) {
    const used = process.memoryUsage()
    console.log(`🧠 Email Memory [${step}]: ${Math.round(used.heapUsed / 1024 / 1024)}MB heap, ${Math.round(used.rss / 1024 / 1024)}MB RSS`)
  }

  async sendBilingualApplicationNotification(data: ValidatedApplicationData): Promise<void> {
    if (!process.env.ENABLE_EMAIL_NOTIFICATIONS || process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
      console.log('Email notifications disabled')
      return
    }

    const hrEmail = process.env.HR_EMAIL || 'inbox@ohthatgrp.com'
    const subject = `New Application - ${data.legalFirstName} ${data.legalLastName} - ${data.state}`

    try {
      this.logMemoryUsage('email-start')
      // Generate both English and Spanish PDFs
      const pdfService = new PDFService()
      const bilingualResult = await pdfService.generateBilingualApplicationPDF(data)
      this.logMemoryUsage('after-bilingual-pdf-generation')
      
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
      
      // I-9 form is now included in the unified application PDFs above
      console.log('✅ I-9 form included in unified application PDFs')

      // Add user documents as a single ZIP attachment (preserves originals)
      const userDocumentsZip = await this.createUserDocumentsZip(data)
      if (userDocumentsZip) {
        attachments.push(userDocumentsZip)
        console.log(`📦 User documents ZIP attachment added: ${userDocumentsZip.filename}`)
      }
      
      this.logMemoryUsage('after-attachments-prepared')

      console.log('Preparing to send bilingual email notification:', {
        recipient: hrEmail,
        subject: subject,
        submissionId: data.submissionId,
        totalAttachments: attachments.length,
        attachmentSizes: attachments.map(a => ({ name: a.filename, size: `${Math.round(a.content.length * 0.75)} bytes` })),
        attachmentTypes: attachments.map(a => ({ name: a.filename, type: a.contentType }))
      })

      // Use custom send-email function with retry logic for reliability
      const emailEndpoint = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/send-email`
      const emailPayload = {
        to: hrEmail,
        subject: subject,
        text: this.generateBilingualPlainTextEmail(data, attachments.length),
        attachments: attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          contentType: att.contentType
        }))
      }
      
      this.logMemoryUsage('before-email-send')
      
      // Calculate payload size and handle if too large
      const payloadSize = JSON.stringify(emailPayload).length
      const payloadSizeMB = Math.round(payloadSize / 1024 / 1024 * 100) / 100
      console.log(`📏 Email payload size: ${payloadSizeMB}MB`)
      
      // If payload is still too large (>8MB), fall back to individual attachments
      if (payloadSizeMB > 8 && userDocumentsZip) {
        console.log(`⚠️ ZIP payload still too large (${payloadSizeMB}MB), falling back to individual attachments`)
        
        // Remove ZIP attachment and add individual documents
        const attachmentsWithoutZip = attachments.filter(att => att.filename !== userDocumentsZip.filename)
        
        // Add individual documents (original approach)
        if (data.documents && data.documents.length > 0) {
          for (const doc of data.documents) {
            attachmentsWithoutZip.push({
              filename: doc.name,
              content: doc.data,
              contentType: doc.mimeType
            })
          }
        }
        
        emailPayload.attachments = attachmentsWithoutZip.map(att => ({
          content: att.content,
          filename: att.filename,
          contentType: att.contentType
        }))
        
        const fallbackPayloadSize = JSON.stringify(emailPayload).length
        console.log(`📏 Fallback payload size: ${Math.round(fallbackPayloadSize / 1024 / 1024 * 100) / 100}MB`)
      }
      
      const response = await this.fetchWithRetry(emailEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      }, 3)
      
      this.logMemoryUsage('after-email-send')

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
    const hasUserDocs = data.documents && data.documents.length > 0
    const docInfo = hasUserDocs 
      ? `\n\nAttached Documents:\n- Application form (English & Spanish PDFs, includes I-9 form)\n- Applicant documents (ZIP file - extract to view originals)`
      : `\n\nAttached Documents:\n- Application form (English & Spanish PDFs, includes I-9 form)`
    
    return `Applicant Information:
- Name: ${data.legalFirstName} ${data.legalLastName}
- Email: ${data.email}
- Phone: ${data.phoneNumber}
- Address: ${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}

Application Details:
- Submission ID: ${data.submissionId}
- Submitted: ${data.submittedAt}${docInfo}`
  }
}