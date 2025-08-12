#!/usr/bin/env node

/**
 * Test script for FileUploadService with document conversion
 * Tests the integration between FileUploadService and DocumentConverter
 */

const { FileUploadService } = require('./shared/services/FileUploadService')

async function testFileUploadIntegration() {
  console.log('🧪 Testing FileUploadService Document Conversion Integration')
  console.log('==========================================================')

  const uploadService = new FileUploadService()

  // Test 1: Create mock files of different types
  console.log('\n1. Creating mock upload files...')
  
  const mockFiles = [
    {
      type: 'resume',
      name: 'resume.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      data: Buffer.from('Mock PDF content').toString('base64')
    },
    {
      type: 'resume', 
      name: 'resume.docx',
      size: 2048,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      data: Buffer.from('Mock DOCX content').toString('base64')
    },
    {
      type: 'certification',
      name: 'certificate.doc',
      size: 1536,
      mimeType: 'application/msword',
      data: Buffer.from('Mock DOC content').toString('base64')
    },
    {
      type: 'identification',
      name: 'id.jpg',
      size: 512,
      mimeType: 'image/jpeg',
      data: Buffer.from('Mock JPEG content').toString('base64')
    }
  ]

  console.log(`   Created ${mockFiles.length} mock files`)

  // Test 2: Validate individual files
  console.log('\n2. Testing individual file validation...')
  
  for (const file of mockFiles) {
    console.log(`\n   Testing: ${file.name} (${file.type})`)
    
    try {
      const result = await uploadService.validateFile(file)
      
      if (result.isValid) {
        if (result.convertedFile) {
          console.log(`     ✅ Valid with conversion: ${file.name} → ${result.convertedFile.name}`)
          console.log(`     📊 Size change: ${file.size} → ${result.convertedFile.size} bytes`)
          console.log(`     🔄 MIME type: ${file.mimeType} → ${result.convertedFile.mimeType}`)
        } else {
          console.log(`     ✅ Valid (no conversion needed)`)
        }
      } else {
        console.log(`     ❌ Invalid: ${result.errorKey}`)
      }
      
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`)
    }
  }

  // Test 3: Test bulk validation
  console.log('\n3. Testing bulk file validation...')
  
  try {
    const bulkResult = await uploadService.validateAllFiles(mockFiles)
    
    console.log(`   📊 Results:`)
    console.log(`     Valid files: ${bulkResult.validFiles.length}`)
    console.log(`     Errors: ${bulkResult.errors.length}`)
    
    if (bulkResult.errors.length > 0) {
      console.log('\n   ❌ Errors found:')
      bulkResult.errors.forEach(error => {
        console.log(`     - ${error.fileName}: ${error.errorKey}`)
      })
    }

    if (bulkResult.validFiles.length > 0) {
      console.log('\n   ✅ Valid files:')
      bulkResult.validFiles.forEach(file => {
        const isConverted = file.name.endsWith('.pdf') && mockFiles.find(m => m.name === file.name.replace('.pdf', '.docx') || m.name === file.name.replace('.pdf', '.doc'))
        console.log(`     - ${file.name} (${file.mimeType}) ${isConverted ? '🔄 [CONVERTED]' : ''}`)
      })
    }

  } catch (error) {
    console.log(`   ❌ Bulk validation error: ${error.message}`)
  }

  console.log('\n🏁 FileUploadService integration test completed!')
  console.log('\nNotes:')
  console.log('- DOC/DOCX files should be converted to PDF automatically')
  console.log('- PDF and image files should pass through unchanged')
  console.log('- Conversion failures should be gracefully handled with user-friendly errors')
}

// Run the test
testFileUploadIntegration().catch(error => {
  console.error('Integration test failed:', error)
  process.exit(1)
})