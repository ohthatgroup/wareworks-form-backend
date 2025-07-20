// netlify/functions/get-config.js
// WareWorks Form Configuration Endpoint

exports.handler = async (event, context) => {
  // Define CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allows all origins
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders, // Ensure corsHeaders are returned for OPTIONS
      body: ''
    };
  }

  try {
    // Get the referer for basic security
    const referer = event.headers.referer || '';
    const allowedDomains = [
      'wareworks.me',
      'www.wareworks.me',
      'wareworks.webflow.io',
      'localhost',
      '127.0.0.1'
    ];

    // Check if request is from allowed domain
    const isAllowed = allowedDomains.some(domain => referer.includes(domain));
    
    if (!isAllowed && referer !== '') {
      console.log(`Unauthorized access attempt from: ${referer}`);
      return {
        statusCode: 403,
        headers: corsHeaders, // Ensure corsHeaders are returned for 403
        body: JSON.stringify({ 
          error: 'Forbidden',
          message: 'Access denied from this domain'
        })
      };
    }

    // Configuration from environment variables
    const config = {
      version: "1.0",
      environment: process.env.ENVIRONMENT || 'production',
      lastUpdated: new Date().toISOString(),
      
      // Main endpoints
      SUBMIT_URL: process.env.NETLIFY_SUBMIT_URL,
      
      // Google Sheets configuration
      GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
      
      // Email configuration
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@wareworks.me',
      FROM_EMAIL: process.env.FROM_EMAIL || 'web@wareworks.me',
      
      // Limits and Features
      MAX_EDUCATION_ENTRIES: parseInt(process.env.MAX_EDUCATION_ENTRIES) || 5,
      MAX_EMPLOYMENT_ENTRIES: parseInt(process.env.MAX_EMPLOYMENT_ENTRIES) || 10,
      DATA_RETENTION_HOURS: parseInt(process.env.DATA_RETENTION_HOURS) || 24,
      
      // Feature Flags
      ENABLE_AUDIT_LOGGING: process.env.ENABLE_AUDIT_LOGGING === 'true',
      ENABLE_DEBUG_MODE: process.env.ENABLE_DEBUG_MODE === 'true',
      ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      ENABLE_GOOGLE_SHEETS: process.env.ENABLE_GOOGLE_SHEETS === 'true',
      ENABLE_PDF_GENERATION: process.env.ENABLE_PDF_GENERATION === 'true',
      
      // UI Settings
      DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',
      SUPPORTED_LANGUAGES: ['en', 'es']
    };

    console.log(`Configuration accessed from: ${referer || 'unknown'} at ${new Date()}`);

    return {
      statusCode: 200,
      headers: { // Merge corsHeaders with other headers for success response
        ...corsHeaders,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(config)
    };

  } catch (error) {
    console.error('Configuration endpoint error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders, // Ensure corsHeaders are returned for 500
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: 'Failed to load configuration'
      })
    };
  }
};
