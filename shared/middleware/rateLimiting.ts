import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

// In-memory store for rate limiting (suitable for serverless)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => rateLimitStore.delete(key))
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

export class RateLimiter {
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || 'Too many requests. Please try again later.',
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator
    }
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown'
    return `ratelimit:${ip}`
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const key = this.config.keyGenerator(request)
    const now = Date.now()
    
    let entry = rateLimitStore.get(key)
    
    // Initialize or reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      }
    }

    // Increment request count
    entry.count++
    rateLimitStore.set(key, entry)

    const remaining = Math.max(0, this.config.maxRequests - entry.count)
    const allowed = entry.count <= this.config.maxRequests

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkLimit(request)

      if (!result.allowed) {
        return NextResponse.json(
          { 
            error: this.config.message,
            retryAfter: result.retryAfter 
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
              'Retry-After': result.retryAfter?.toString() || '60'
            }
          }
        )
      }

      // Add rate limit headers to successful requests
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', result.limit.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())

      return null // Continue to next middleware/handler
    }
  }
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // Strict rate limiting for form submissions
  formSubmission: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3, // 3 submissions per 15 minutes per IP
    message: 'Too many form submissions. Please wait 15 minutes before submitting again.'
  }),

  // Moderate rate limiting for API endpoints
  api: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100, // 100 requests per 5 minutes per IP
    message: 'Too many API requests. Please slow down.'
  }),

  // Strict rate limiting for file uploads
  fileUpload: new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10, // 10 uploads per 10 minutes per IP
    message: 'Too many file uploads. Please wait before uploading more files.'
  }),

  // Very strict rate limiting for download endpoints
  download: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 downloads per minute per IP
    message: 'Too many download requests. Please wait a moment.'
  })
}

// Helper function to apply rate limiting to API routes
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: RateLimiter,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const limitResult = await rateLimiter.checkLimit(request)

  if (!limitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
        retryAfter: limitResult.retryAfter 
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(limitResult.resetTime / 1000).toString(),
          'Retry-After': limitResult.retryAfter?.toString() || '60'
        }
      }
    )
  }

  try {
    const response = await handler()
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', limitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(limitResult.resetTime / 1000).toString())

    return response
  } catch (error) {
    // Don't count failed requests against rate limit
    const key = rateLimiter['config'].keyGenerator(request)
    const entry = rateLimitStore.get(key)
    if (entry) {
      entry.count = Math.max(0, entry.count - 1)
      rateLimitStore.set(key, entry)
    }
    
    throw error
  }
}