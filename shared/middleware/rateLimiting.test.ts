// Simple test file to verify rate limiting functionality
// This would normally be part of a proper test suite

import { RateLimiter } from './rateLimiting'

// Mock NextRequest for testing
class MockNextRequest {
  headers: Map<string, string>
  
  constructor(ip: string = '127.0.0.1') {
    this.headers = new Map()
    this.headers.set('x-forwarded-for', ip)
  }

  get(name: string): string | null {
    return this.headers.get(name) || null
  }
}

// Basic test function
async function testRateLimiting() {
  console.log('Testing Rate Limiting...')
  
  const limiter = new RateLimiter({
    windowMs: 1000, // 1 second window
    maxRequests: 3   // 3 requests max
  })

  const mockRequest = new MockNextRequest() as any

  // Test 1: First 3 requests should be allowed
  for (let i = 1; i <= 3; i++) {
    const result = await limiter.checkLimit(mockRequest)
    console.log(`Request ${i}:`, {
      allowed: result.allowed,
      remaining: result.remaining
    })
    
    if (!result.allowed) {
      console.error(`❌ Request ${i} should have been allowed`)
      return false
    }
  }

  // Test 2: 4th request should be blocked
  const blockedResult = await limiter.checkLimit(mockRequest)
  console.log('Request 4 (should be blocked):', {
    allowed: blockedResult.allowed,
    retryAfter: blockedResult.retryAfter
  })
  
  if (blockedResult.allowed) {
    console.error('❌ Request 4 should have been blocked')
    return false
  }

  // Test 3: Wait for window to reset
  console.log('Waiting for rate limit window to reset...')
  await new Promise(resolve => setTimeout(resolve, 1100))

  const resetResult = await limiter.checkLimit(mockRequest)
  console.log('Request after reset:', {
    allowed: resetResult.allowed,
    remaining: resetResult.remaining
  })
  
  if (!resetResult.allowed) {
    console.error('❌ Request after reset should have been allowed')
    return false
  }

  console.log('✅ All rate limiting tests passed!')
  return true
}

// Export for potential use
export { testRateLimiting }

// Run test if this file is executed directly
if (require.main === module) {
  testRateLimiting().catch(console.error)
}