import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '../../../../../../shared/middleware/csrfProtection'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Generate and return CSRF token
    return await generateCSRFToken()
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request)
}