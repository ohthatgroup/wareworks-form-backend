import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const submissionId = searchParams.get('submissionId')
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Call the PDF generation service (assuming it's available via Netlify functions)
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://wareworks-backend.netlify.app'
    const pdfResponse = await fetch(`${baseUrl}/.netlify/functions/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submissionId,
        // Include any other necessary data for PDF generation
      }),
    })

    if (!pdfResponse.ok) {
      console.error('PDF generation failed:', pdfResponse.status, pdfResponse.statusText)
      
      // Try to get stored application data instead
      try {
        const submissionResponse = await fetch(`${baseUrl}/.netlify/functions/get-submission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ submissionId }),
        })
        
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json()
          
          // Generate a simple PDF from the submission data
          const pdfBuffer = await generateSimplePDF(submissionData, submissionId)
          
          return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="Wareworks_Application_${submissionId}.pdf"`,
              'Cache-Control': 'no-cache',
            },
          })
        }
      } catch (fallbackError) {
        console.error('Fallback PDF generation failed:', fallbackError)
      }
      
      return NextResponse.json(
        { error: 'PDF generation failed. Please contact support.' },
        { status: 500 }
      )
    }

    // Stream the PDF response
    const pdfBuffer = await pdfResponse.arrayBuffer()
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Wareworks_Application_${submissionId}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateSimplePDF(submissionData: any, submissionId: string): Promise<Buffer> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Standard letter size
    
    // Get fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // Define colors
    const black = rgb(0, 0, 0)
    const darkBlue = rgb(0.2, 0.3, 0.6)
    
    let yPosition = 750
    const leftMargin = 50
    const lineHeight = 20
    
    // Title
    page.drawText('WAREWORKS APPLICATION CONFIRMATION', {
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
    
    // Personal Information Section
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
      `Date of Birth: ${submissionData.dateOfBirth || 'N/A'}`,
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
    
    yPosition -= 20
    
    // Position Information
    if (submissionData.positionApplied) {
      page.drawText('POSITION INFORMATION', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: darkBlue,
      })
      
      yPosition -= 25
      page.drawText(`Position Applied: ${submissionData.positionApplied}`, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: black,
      })
      yPosition -= lineHeight
      
      if (submissionData.expectedSalary) {
        page.drawText(`Expected Salary: ${submissionData.expectedSalary}`, {
          x: leftMargin,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: black,
        })
        yPosition -= lineHeight
      }
      
      yPosition -= 20
    }
    
    // Availability
    if (submissionData.fullTimeEmployment) {
      page.drawText('AVAILABILITY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: darkBlue,
      })
      
      yPosition -= 25
      
      const availability = [
        `Full-time Employment: ${submissionData.fullTimeEmployment}`,
        `Swing Shifts: ${submissionData.swingShifts || 'N/A'}`,
        `Graveyard Shifts: ${submissionData.graveyardShifts || 'N/A'}`,
      ]
      
      availability.forEach(info => {
        page.drawText(info, {
          x: leftMargin,
          y: yPosition,
          size: 11,
          font: helveticaFont,
          color: black,
        })
        yPosition -= lineHeight
      })
      
      yPosition -= 20
    }
    
    // Footer
    yPosition = Math.max(yPosition, 100)
    page.drawText('APPLICATION STATUS: SUBMITTED SUCCESSFULLY', {
      x: leftMargin,
      y: yPosition,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0.6, 0),
    })
    
    yPosition -= 30
    page.drawText('Thank you for your application to Wareworks!', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: black,
    })
    
    yPosition -= lineHeight
    page.drawText('Our HR team will review your application and contact you regarding next steps.', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: black,
    })
    
    yPosition -= 30
    page.drawText('Questions? Contact us at: hr@wareworks.me', {
      x: leftMargin,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: darkBlue,
    })
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
    
  } catch (error) {
    console.error('PDF generation error:', error)
    // Fallback to simple text-based response
    const fallbackContent = `
WAREWORKS APPLICATION CONFIRMATION

Submission ID: ${submissionId}
Submitted: ${new Date().toLocaleString()}

Application Status: Submitted Successfully

Thank you for your application to Wareworks!
For questions, please contact: hr@wareworks.me
    `
    return Buffer.from(fallbackContent, 'utf-8')
  }
}