import { NextRequest, NextResponse } from 'next/server'
import { applicationSchema } from '../../../../../../shared/validation/schemas'
import { PDFService } from '../../../../../../shared/services/PDFService'
import { EmailService } from '../../../../../../shared/services/EmailService'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function POST(request: NextRequest) {
  console.log('API route called - POST /api/submit-application')
    
    try {
      // Parse the request body
      const body = await request.json()
      console.log('Request body received, fields:', Object.keys(body).length)
      
      // Validate using Zod schema
      const validationResult = applicationSchema.safeParse(body)
      if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error.issues)
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationResult.error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message
            }))
          },
          { status: 400 }
        )
      }

      // Generate submission ID and timestamp
      const submissionId = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      const submittedAt = new Date().toISOString()
      
      const submissionData = {
        ...validationResult.data,
        submissionId,
        submittedAt
      }
      
      console.log('Form submission processed:', {
        submissionId,
        submittedAt,
        applicantName: `${submissionData.legalFirstName} ${submissionData.legalLastName}`,
        fieldsReceived: Object.keys(submissionData).length
      })

      // Generate PDF
      let pdfBuffer: Buffer | null = null
      try {
        const pdfService = new PDFService()
        const pdfResult = await pdfService.generateApplicationPDF(submissionData)
        
        // Handle different return types from PDFService
        if (Buffer.isBuffer(pdfResult)) {
          pdfBuffer = pdfResult
        } else if (pdfResult && typeof pdfResult === 'object' && 'applicationPDF' in pdfResult) {
          pdfBuffer = pdfResult.applicationPDF
        }
        
        if (pdfBuffer) {
          console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')
        }
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError)
        // Continue without PDF - don't fail the entire submission
      }

      // Send email notification
      try {
        if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
          const emailService = new EmailService()
          await emailService.sendApplicationNotification(submissionData, pdfBuffer)
          console.log('Email notification sent successfully')
        } else {
          console.log('Email notifications disabled')
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Continue without email - don't fail the entire submission
      }

      // Store submission data temporarily for PDF download
      // In production, this would be in a database
      if (typeof global !== 'undefined') {
        const globalAny = global as any
        globalAny.submissionStore = globalAny.submissionStore || new Map()
        globalAny.submissionStore.set(submissionId, { 
          ...submissionData, 
          pdfBuffer: pdfBuffer?.toString('base64') // Store as base64 for retrieval
        })
      }

      // Return success response with download capability
      return NextResponse.json({
        success: true,
        submissionId,
        message: 'Application submitted successfully',
        downloadUrl: `/api/submit-application?download=${submissionId}`,
        data: {
          submissionId,
          submittedAt,
          applicantName: `${body.legalFirstName} ${body.legalLastName}`
        }
      })

  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Handle PDF downloads
export async function GET(request: NextRequest) {
  try {
      const { searchParams } = request.nextUrl
      const submissionId = searchParams.get('download')
      
      if (!submissionId) {
        return NextResponse.json(
          { error: 'Submission ID is required for download' },
          { status: 400 }
        )
      }

      // Retrieve submission data
      let submissionData = null
      if (typeof global !== 'undefined') {
        const globalAny = global as any
        if (globalAny.submissionStore) {
          submissionData = globalAny.submissionStore.get(submissionId)
        }
      }

      if (!submissionData) {
        return NextResponse.json(
          { error: 'Submission not found or expired' },
          { status: 404 }
        )
      }

      // Generate PDF
      const pdfBuffer = await generateApplicationPDF(submissionData, submissionId)
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Wareworks_Application_${submissionId}.pdf"`,
          'Cache-Control': 'no-cache',
        },
      })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

async function generateApplicationPDF(submissionData: any, submissionId: string): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792])
    
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const black = rgb(0, 0, 0)
    const darkBlue = rgb(0.2, 0.3, 0.6)
    
    let yPosition = 750
    const leftMargin = 50
    const lineHeight = 20
    
    // Title
    page.drawText('WAREWORKS APPLICATION', {
      x: leftMargin,
      y: yPosition,
      size: 18,
      font: helveticaBoldFont,
      color: darkBlue,
    })
    
    yPosition -= 40
    
    // Submission details
    page.drawText(`Submission ID: ${submissionId}`, {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: black,
    })
    
    yPosition -= lineHeight
    page.drawText(`Submitted: ${new Date().toLocaleString()}`, {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: black,
    })
    
    yPosition -= 30
    
    // Personal Information
    page.drawText('PERSONAL INFORMATION', {
      x: leftMargin,
      y: yPosition,
      size: 14,
      font: helveticaBoldFont,
      color: darkBlue,
    })
    
    yPosition -= 25
    
    const personalInfo = [
      `Name: ${submissionData.legalFirstName || 'N/A'} ${submissionData.legalLastName || 'N/A'}`,
      `Email: ${submissionData.email || 'N/A'}`,
      `Phone: ${submissionData.phoneNumber || 'N/A'}`,
      `Address: ${submissionData.streetAddress || 'N/A'}`,
      `City, State, ZIP: ${submissionData.city || 'N/A'}, ${submissionData.state || 'N/A'} ${submissionData.zipCode || 'N/A'}`,
    ]
    
    personalInfo.forEach(info => {
      page.drawText(info, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: black,
      })
      yPosition -= lineHeight
    })
    
    // Footer
    yPosition = Math.max(yPosition, 100)
    page.drawText('APPLICATION STATUS: SUBMITTED SUCCESSFULLY', {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0.6, 0),
    })
    
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
    
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF')
  }
}