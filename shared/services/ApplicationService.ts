import { ValidatedApplicationData } from '../validation/schemas'
import { SubmissionResult } from '../types'
import { EmailService } from './EmailService'
import { PDFService } from './PDFService'

export class ApplicationService {
  private emailService: EmailService
  private pdfService: PDFService

  constructor() {
    this.emailService = new EmailService()
    this.pdfService = new PDFService()
  }

  async submitApplication(data: ValidatedApplicationData): Promise<SubmissionResult> {
    try {
      console.log('Processing application:', data.submissionId)

      // Generate PDF if enabled
      let pdfBuffer: Buffer | null = null
      if (process.env.ENABLE_PDF_GENERATION === 'true') {
        try {
          const pdfResult = await this.pdfService.generateApplicationPDF(data)
          // Handle both single PDF and multiple PDF results
          if (Buffer.isBuffer(pdfResult)) {
            pdfBuffer = pdfResult
          } else {
            // Use the main application PDF, I-9 will be handled separately
            pdfBuffer = pdfResult.applicationPDF
          }
          console.log('PDF generated successfully')
        } catch (error) {
          console.error('PDF generation failed:', error)
          // Don't fail the entire submission for PDF issues
        }
      }

      // Send email notification if enabled
      if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
        try {
          await this.emailService.sendApplicationNotification(data, pdfBuffer)
          console.log('Email notification sent')
        } catch (error) {
          console.error('Email notification failed:', error)
          // Don't fail the entire submission for email issues
        }
      }

      return {
        success: true,
        submissionId: data.submissionId,
        timestamp: data.submittedAt,
        message: 'Application submitted successfully'
      }

    } catch (error) {
      console.error('Application submission failed:', error)
      
      return {
        success: false,
        submissionId: data.submissionId,
        timestamp: data.submittedAt,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}