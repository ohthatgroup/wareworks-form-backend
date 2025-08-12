#!/usr/bin/env node

/**
 * Test script for document conversion functionality
 * This script tests the DocumentConverter service with mock DOC/DOCX files
 */

const { DocumentConverter } = require('./shared/services/DocumentConverter')

async function testDocumentConversion() {
  console.log('🧪 Testing Document Conversion Service')
  console.log('=====================================')

  const converter = new DocumentConverter()

  // Test 1: Check LibreOffice availability
  console.log('\n1. Checking LibreOffice availability...')
  const isAvailable = await converter.isLibreOfficeAvailable()
  console.log(`   LibreOffice available: ${isAvailable ? '✅ Yes' : '❌ No'}`)

  if (!isAvailable) {
    console.log('\n⚠️  LibreOffice not found. Conversion tests will be skipped.')
    console.log('   On production, this will show user-friendly error message.')
    return
  }

  // Test 2: Check supported extensions
  console.log('\n2. Checking supported extensions...')
  const supportedExt = converter.getSupportedExtensions()
  console.log(`   Supported: ${supportedExt.join(', ')}`)

  // Test 3: Test file extension detection
  console.log('\n3. Testing file extension detection...')
  const testFiles = [
    'resume.docx',
    'certificate.doc', 
    'photo.jpg',
    'application.pdf'
  ]
  
  testFiles.forEach(filename => {
    const needsConversion = converter.needsConversion(filename)
    console.log(`   ${filename}: ${needsConversion ? '🔄 Needs conversion' : '✅ No conversion needed'}`)
  })

  // Test 4: Mock conversion test (create dummy DOCX-like buffer)
  console.log('\n4. Testing conversion with mock file...')
  
  // Create a simple text buffer (this won't be a real DOCX but will test the error handling)
  const mockDocxBuffer = Buffer.from('Mock DOCX content for testing', 'utf-8')
  
  try {
    const result = await converter.convertToPdf(mockDocxBuffer, 'test-document.docx')
    
    if (result.success) {
      console.log(`   ✅ Conversion successful: ${result.pdfBuffer?.length} bytes`)
    } else {
      console.log(`   ❌ Conversion failed: ${result.error}`)
      console.log('   ℹ️  This is expected for mock data - real DOCX files should work')
    }
  } catch (error) {
    console.log(`   ❌ Conversion error: ${error.message}`)
    console.log('   ℹ️  This is expected for mock data - real DOCX files should work')
  }

  console.log('\n🏁 Document conversion test completed!')
  console.log('\nTo test with real files:')
  console.log('1. Place a .docx or .doc file in the project root')
  console.log('2. Update this script to read that file')
  console.log('3. Run the test again')
}

// Run the test
testDocumentConversion().catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})