import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    // Get service account credentials from environment
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const sheetId = process.env.GOOGLE_SHEETS_ID || '1jgMtCCuntq8nA_zQTz8QWSnRd4YjevjXW2sPPQUwIy4'

    if (!serviceAccountEmail || !privateKey) {
      console.warn('Service account credentials not configured, falling back to CSV')
      return NextResponse.json({ error: 'Service account not configured' }, { status: 500 })
    }

    // Create JWT auth client
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    })

    // Initialize Google Sheets API
    const sheets = google.sheets({ version: 'v4', auth })

    // Get sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1', // Default sheet name
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data found in sheet' }, { status: 404 })
    }

    // Return the data in the same format as the old Google Sheets API
    return NextResponse.json({
      values: rows,
      range: response.data.range,
      majorDimension: response.data.majorDimension
    })

  } catch (error) {
    console.error('Google Sheets API error:', error)
    
    // More specific error messages
    let errorMessage = 'Failed to fetch translations'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('Unable to parse')) {
        errorMessage = 'Invalid service account key format'
        statusCode = 500
      } else if (error.message.includes('403')) {
        errorMessage = 'Service account lacks permissions - check sheet sharing'
        statusCode = 403
      } else if (error.message.includes('404')) {
        errorMessage = 'Google Sheet not found'
        statusCode = 404
      } else if (error.message.includes('401')) {
        errorMessage = 'Service account authentication failed'
        statusCode = 401
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: statusCode })
  }
}

// Add OPTIONS for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}