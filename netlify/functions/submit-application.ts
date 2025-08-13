import { Handler } from '@netlify/functions'
import { validateApplication } from '../../shared/validation/schemas'
import { ApplicationService } from '../../shared/services/ApplicationService'

// Simple in-memory rate limiting (production should use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxAttempts: number // Max attempts per window
}

const rateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 3 // 3 submissions per 15 minutes per IP
}

function checkRateLimit(clientIP: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const key = `ratelimit:${clientIP}`
  
  const existing = rateLimitStore.get(key)
  
  // Clean up expired entries
  if (existing && now > existing.resetTime) {
    rateLimitStore.delete(key)
  }
  
  const current = rateLimitStore.get(key)
  
  if (!current) {
    // First request from this IP
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs
    })
    return { allowed: true }
  }
  
  if (current.count >= rateLimitConfig.maxAttempts) {
    // Rate limit exceeded
    return { 
      allowed: false, 
      resetTime: current.resetTime 
    }
  }
  
  // Increment counter
  current.count++
  rateLimitStore.set(key, current)
  
  return { allowed: true }
}

export const handler: Handler = async (event, context) => {
  // Define allowed origins based on environment and iframe setup
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://wareworks.me',                    // Marketing site with iframe
        'https://wareworks-backend.netlify.app'   // Direct app access
      ]
    : [
        'http://localhost:3000',    // Local dev
        'http://localhost:3001', 
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:8888',    // Netlify dev
        'http://127.0.0.1:3000',    // Alternative localhost
        'http://127.0.0.1:8888'
      ]

  // Get the origin from the request
  const origin = event.headers.origin || event.headers.Origin || ''
  
  // Check if the origin is allowed
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : null
  
  // Log security events for blocked origins (but don't block the request entirely for backwards compatibility)
  if (origin && !allowedOrigin) {
    console.warn(`🚨 CORS: Blocked origin "${origin}". Allowed origins:`, allowedOrigins)
  }
  
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin || 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Get client IP for rate limiting
    const clientIP = event.headers['x-forwarded-for'] || 
                     event.headers['x-real-ip'] || 
                     context.clientContext?.ip || 
                     'unknown'

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetTime ? new Date(rateLimitResult.resetTime) : null
      
      return {
        statusCode: 429,
        headers: {
          ...headers,
          'Retry-After': resetTime ? Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString() : '900'
        },
        body: JSON.stringify({ 
          error: 'Too many submissions',
          message: `Rate limit exceeded. Try again ${resetTime ? 'at ' + resetTime.toISOString() : 'in 15 minutes'}.`,
          resetTime: resetTime?.toISOString()
        })
      }
    }

    // Parse request body
    const data = JSON.parse(event.body || '{}')
    
    // Add server metadata
    data.submittedAt = new Date().toISOString()
    data.submissionId = generateSubmissionId()
    data.ipAddress = clientIP
    data.userAgent = event.headers['user-agent'] || 'unknown'

    console.log(`Processing submission ${data.submissionId} from IP: ${clientIP}`)

    // Validate data
    const validation = validateApplication(data)
    if (!validation.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        })
      }
    }

    // Process application
    const applicationService = new ApplicationService()
    const result = await applicationService.submitApplication(validation.data)

    console.log(`Submission ${data.submissionId} processed successfully`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }

  } catch (error) {
    console.error('Submission error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

function generateSubmissionId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `WW_${timestamp}_${random}`
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute