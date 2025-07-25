import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'

interface CSRFConfig {
  tokenName?: string
  headerName?: string
  cookieName?: string
  secretLength?: number
  maxAge?: number // Token expiration in milliseconds
  sameSite?: 'strict' | 'lax' | 'none'
  secure?: boolean
  httpOnly?: boolean
}

interface CSRFToken {
  token: string
  secret: string
  createdAt: number
  expiresAt: number
}

// In-memory token store (production should use Redis or database)
const tokenStore = new Map<string, CSRFToken>()

// Clean up expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now()
  const expiredKeys: string[] = []
  
  tokenStore.forEach((tokenData, key) => {
    if (now > tokenData.expiresAt) {
      expiredKeys.push(key)
    }
  })
  
  expiredKeys.forEach(key => tokenStore.delete(key))
}, 10 * 60 * 1000)

export class CSRFProtection {
  private config: Required<CSRFConfig>

  constructor(config: CSRFConfig = {}) {
    this.config = {
      tokenName: config.tokenName || 'csrfToken',
      headerName: config.headerName || 'x-csrf-token',
      cookieName: config.cookieName || 'csrf-secret',
      secretLength: config.secretLength || 32,
      maxAge: config.maxAge || 60 * 60 * 1000, // 1 hour
      sameSite: config.sameSite || 'strict',
      secure: config.secure ?? true,
      httpOnly: config.httpOnly ?? true
    }
  }

  // Generate a new CSRF token pair
  generateToken(): { token: string; secret: string } {
    const secret = randomBytes(this.config.secretLength).toString('hex')
    const token = this.createTokenFromSecret(secret)
    
    const now = Date.now()
    const tokenData: CSRFToken = {
      token,
      secret,
      createdAt: now,
      expiresAt: now + this.config.maxAge
    }
    
    tokenStore.set(token, tokenData)
    
    return { token, secret }
  }

  // Create token from secret (for validation)
  private createTokenFromSecret(secret: string): string {
    const timestamp = Date.now().toString()
    const payload = `${secret}:${timestamp}`
    return createHash('sha256').update(payload).digest('hex')
  }

  // Validate CSRF token
  validateToken(token: string, secret: string): boolean {
    if (!token || !secret) {
      return false
    }

    const storedTokenData = tokenStore.get(token)
    if (!storedTokenData) {
      return false
    }

    // Check if token is expired
    if (Date.now() > storedTokenData.expiresAt) {
      tokenStore.delete(token)
      return false
    }

    // Validate secret matches
    if (storedTokenData.secret !== secret) {
      return false
    }

    return true
  }

  // Generate CSRF token endpoint
  async generateTokenResponse(): Promise<NextResponse> {
    const { token, secret } = this.generateToken()
    
    const response = NextResponse.json({
      success: true,
      token,
      tokenName: this.config.tokenName,
      headerName: this.config.headerName
    })

    // Set secret in HTTP-only cookie
    response.cookies.set(this.config.cookieName, secret, {
      httpOnly: this.config.httpOnly,
      secure: this.config.secure,
      sameSite: this.config.sameSite,
      maxAge: Math.floor(this.config.maxAge / 1000), // Convert to seconds
      path: '/'
    })

    return response
  }

  // Middleware to validate CSRF tokens
  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      // Skip CSRF validation for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return null
      }

      // Get token from header or body
      const tokenFromHeader = request.headers.get(this.config.headerName)
      let tokenFromBody = null
      
      try {
        if (request.headers.get('content-type')?.includes('application/json')) {
          const body = await request.json()
          tokenFromBody = body[this.config.tokenName]
          // Re-create request with parsed body for next handler
          const newRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(body)
          })
          Object.setPrototypeOf(newRequest, NextRequest.prototype)
          request = newRequest as NextRequest
        }
      } catch (error) {
        // Body parsing failed, continue without token from body
      }

      const token = tokenFromHeader || tokenFromBody
      
      // Get secret from cookie
      const secret = request.cookies.get(this.config.cookieName)?.value

      if (!token || !secret) {
        return NextResponse.json(
          { 
            error: 'CSRF token missing',
            message: 'Request must include a valid CSRF token'
          },
          { status: 403 }
        )
      }

      if (!this.validateToken(token, secret)) {
        return NextResponse.json(
          { 
            error: 'CSRF token invalid',
            message: 'The CSRF token is invalid or expired'
          },
          { status: 403 }
        )
      }

      // Token is valid, continue to next handler
      return null
    }
  }

  // Helper to check if request has valid CSRF token
  async validateRequest(request: NextRequest): Promise<{
    valid: boolean
    error?: string
  }> {
    // Skip validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return { valid: true }
    }

    const tokenFromHeader = request.headers.get(this.config.headerName)
    const secret = request.cookies.get(this.config.cookieName)?.value

    if (!tokenFromHeader || !secret) {
      return { 
        valid: false, 
        error: 'CSRF token or secret missing' 
      }
    }

    if (!this.validateToken(tokenFromHeader, secret)) {
      return { 
        valid: false, 
        error: 'CSRF token invalid or expired' 
      }
    }

    return { valid: true }
  }
}

// Default CSRF protection instance
export const csrfProtection = new CSRFProtection({
  maxAge: 60 * 60 * 1000, // 1 hour
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
})

// Helper function to apply CSRF protection to API routes
export async function withCSRFProtection(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const validation = await csrfProtection.validateRequest(request)

  if (!validation.valid) {
    return NextResponse.json(
      { 
        error: 'CSRF Protection',
        message: validation.error || 'CSRF validation failed'
      },
      { status: 403 }
    )
  }

  return handler()
}

// CSRF token generation endpoint helper
export async function generateCSRFToken(): Promise<NextResponse> {
  return csrfProtection.generateTokenResponse()
}