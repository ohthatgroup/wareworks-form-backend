// Simple test file to verify CSRF protection functionality
// This would normally be part of a proper test suite

import { CSRFProtection } from './csrfProtection'

// Mock NextRequest for testing
class MockNextRequest {
  method: string
  headers: Map<string, string>
  cookies: Map<string, string>
  
  constructor(method: string = 'POST', headers: Record<string, string> = {}, cookies: Record<string, string> = {}) {
    this.method = method
    this.headers = new Map(Object.entries(headers))
    this.cookies = new Map(Object.entries(cookies))
  }

  get(name: string): string | null {
    return this.headers.get(name) || null
  }
}

// Basic test function
async function testCSRFProtection() {
  console.log('Testing CSRF Protection...')
  
  const csrf = new CSRFProtection({
    maxAge: 5000, // 5 seconds for testing
    secure: false  // Disable for testing
  })

  // Test 1: Generate token
  console.log('Test 1: Generate CSRF token')
  const { token, secret } = csrf.generateToken()
  console.log('Generated token:', token.substring(0, 10) + '...')
  console.log('Generated secret:', secret.substring(0, 10) + '...')
  
  if (!token || !secret) {
    console.error('❌ Failed to generate token/secret')
    return false
  }

  // Test 2: Valid token should pass validation
  console.log('Test 2: Validate correct token')
  const isValid = csrf.validateToken(token, secret)
  console.log('Token validation result:', isValid)
  
  if (!isValid) {
    console.error('❌ Valid token failed validation')
    return false
  }

  // Test 3: Invalid secret should fail validation
  console.log('Test 3: Validate with wrong secret')
  const isInvalidSecret = csrf.validateToken(token, 'wrong-secret')
  console.log('Invalid secret validation result:', isInvalidSecret)
  
  if (isInvalidSecret) {
    console.error('❌ Invalid secret passed validation')
    return false
  }

  // Test 4: Invalid token should fail validation
  console.log('Test 4: Validate with wrong token')
  const isInvalidToken = csrf.validateToken('wrong-token', secret)
  console.log('Invalid token validation result:', isInvalidToken)
  
  if (isInvalidToken) {
    console.error('❌ Invalid token passed validation')
    return false
  }

  // Test 5: GET requests should be allowed without CSRF
  console.log('Test 5: GET request validation')
  const mockGetRequest = new MockNextRequest('GET') as any
  const getValidation = await csrf.validateRequest(mockGetRequest)
  console.log('GET request validation:', getValidation)
  
  if (!getValidation.valid) {
    console.error('❌ GET request should be allowed')
    return false
  }

  // Test 6: POST request without token should fail
  console.log('Test 6: POST request without token')
  const mockPostRequest = new MockNextRequest('POST') as any
  const postValidation = await csrf.validateRequest(mockPostRequest)
  console.log('POST without token validation:', postValidation)
  
  if (postValidation.valid) {
    console.error('❌ POST request without token should fail')
    return false
  }

  // Test 7: POST request with valid token should pass
  console.log('Test 7: POST request with valid token')
  const mockValidPostRequest = new MockNextRequest('POST', {
    'x-csrf-token': token
  }, {
    'csrf-secret': secret
  }) as any
  
  // Mock the cookie getter
  mockValidPostRequest.cookies = {
    get: (name: string) => ({ value: name === 'csrf-secret' ? secret : undefined })
  }
  
  const validPostValidation = await csrf.validateRequest(mockValidPostRequest)
  console.log('POST with valid token validation:', validPostValidation)
  
  if (!validPostValidation.valid) {
    console.error('❌ POST request with valid token should pass')
    return false
  }

  // Test 8: Wait for token expiration
  console.log('Test 8: Wait for token expiration (5 seconds)...')
  await new Promise(resolve => setTimeout(resolve, 5100))

  const expiredValidation = csrf.validateToken(token, secret)
  console.log('Expired token validation result:', expiredValidation)
  
  if (expiredValidation) {
    console.error('❌ Expired token should fail validation')
    return false
  }

  console.log('✅ All CSRF protection tests passed!')
  return true
}

// Export for potential use
export { testCSRFProtection }

// Run test if this file is executed directly
if (require.main === module) {
  testCSRFProtection().catch(console.error)
}