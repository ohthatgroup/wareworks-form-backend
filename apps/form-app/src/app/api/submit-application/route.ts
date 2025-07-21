import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('API route called - POST /api/submit-application')
  
  try {
    // Parse the request body
    const body = await request.json()
    console.log('Request body received, fields:', Object.keys(body).length)
    
    // Basic validation - check for required fields
    if (!body.legalFirstName || !body.legalLastName || !body.streetAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate submission ID and timestamp
    const submissionId = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    const submittedAt = new Date().toISOString()
    
    console.log('Form submission processed:', {
      submissionId,
      submittedAt,
      applicantName: `${body.legalFirstName} ${body.legalLastName}`,
      fieldsReceived: Object.keys(body).length
    })

    // Return success response
    return NextResponse.json({
      success: true,
      submissionId,
      message: 'Application submitted successfully',
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