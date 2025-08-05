#!/usr/bin/env tsx

/**
 * Test Signature Functionality in PDF Generation
 * 
 * This script specifically tests that the signature field is properly
 * filled in the generated PDF after the recent fix.
 */

import { PDFService } from '../shared/services/PDFService'
import { ValidatedApplicationData } from '../shared/validation/schemas'
import * as fs from 'fs/promises'
import * as path from 'path'

// Load environment variables from .env.local
async function loadEnvVars() {
  try {
    const envPath = path.join(process.cwd(), 'apps', 'form-app', '.env.local')
    const envContent = await fs.readFile(envPath, 'utf-8')
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=')
          process.env[key] = value
          console.log(`🔧 Loaded env var: ${key} = ${value}`)
        }
      }
    })
  } catch (error) {
    console.warn('⚠️ Could not load .env.local file, using system env vars only')
  }
}

// Test data with signature
const signatureTestData: ValidatedApplicationData = {
  submissionId: 'SIGNATURE-TEST-' + Date.now(),
  submittedAt: new Date().toISOString(),
  
  // Required personal information
  legalFirstName: 'John',
  legalLastName: 'Doe',
  socialSecurityNumber: '123-45-6789',
  dateOfBirth: '1990-01-01',
  
  // Required contact information  
  streetAddress: '123 Test Street',
  city: 'Seattle',
  state: 'WA',
  zipCode: '98101',
  phoneNumber: '(206) 555-0123',
  email: 'john.doe@example.com',
  
  // Basic fields
  citizenshipStatus: 'us_citizen',
  transportation: 'yes',
  workAuthorizationConfirm: 'yes',
  age18: 'yes',
  positionApplied: 'Test Position',
  fullTimeEmployment: 'yes',
  swingShifts: 'no',
  graveyardShifts: 'no',
  previouslyApplied: 'no',
  forkliftCertification: 'no',
  jobDiscovery: 'Test',
  expectedSalary: '$20/hour',
  
  // Emergency contact
  emergencyName: 'Jane Doe',
  emergencyPhone: '(206) 555-0124',
  emergencyRelationship: 'Spouse',
  
  // Education and employment arrays
  education: [],
  employment: [],
  documents: [],
  
  // THE KEY TEST: SIGNATURE DATA
  signature: 'John Michael Doe',
  signatureDate: new Date().toISOString()
}

async function testSignaturePDF(): Promise<boolean> {
  console.log('🖊️ Testing Signature in PDF Generation...')
  console.log('=' .repeat(50))
  
  try {
    // Test environment
    console.log('1️⃣ Checking environment...')
    if (process.env.ENABLE_PDF_GENERATION !== 'true') {
      console.error('❌ ENABLE_PDF_GENERATION is not set to "true"')
      return false
    }
    console.log('✅ PDF generation enabled')
    
    // Test template exists
    console.log('\n2️⃣ Checking template file...')
    const templatePath = path.join(process.cwd(), 'apps', 'form-app', 'public', 'templates', 'Wareworks Application.pdf')
    
    try {
      await fs.access(templatePath)
      console.log('✅ Template found:', templatePath)
    } catch (error) {
      console.error('❌ Template missing:', templatePath)
      return false
    }
    
    // Test PDFService
    console.log('\n3️⃣ Creating PDFService...')
    const pdfService = new PDFService()
    console.log('✅ PDFService created')
    
    // Generate PDF with signature
    console.log('\n4️⃣ Generating PDF with signature...')
    console.log('📝 Test signature:', signatureTestData.signature)
    console.log('📅 Signature date:', new Date(signatureTestData.signatureDate!).toLocaleDateString())
    
    const startTime = Date.now()
    const result = await pdfService.generateApplicationPDF(signatureTestData)
    const duration = Date.now() - startTime
    
    console.log(`⏱️ PDF generation completed in ${duration}ms`)
    
    // Save result
    if (Buffer.isBuffer(result)) {
      console.log('✅ Generated PDF buffer')
      console.log('📊 Size:', result.length, 'bytes')
      
      // Save test PDF for manual verification
      const outputDir = path.join(process.cwd(), 'scripts', 'output')
      await fs.mkdir(outputDir, { recursive: true })
      const outputPath = path.join(outputDir, `signature-test-${Date.now()}.pdf`)
      await fs.writeFile(outputPath, result)
      
      console.log('\n💾 Saved signature test PDF to:', outputPath)
      console.log('\n🔍 MANUAL VERIFICATION REQUIRED:')
      console.log('   1. Open the PDF file above')
      console.log('   2. Look for a signature field containing: "John Michael Doe"')
      console.log('   3. Check that signature date fields are filled')
      console.log('   4. Verify the signature appears in the correct location')
      
      return true
      
    } else if (result && typeof result === 'object' && 'applicationPDF' in result) {
      console.log('✅ Generated multiple PDFs')
      
      // Save application PDF
      const outputDir = path.join(process.cwd(), 'scripts', 'output')
      await fs.mkdir(outputDir, { recursive: true })
      const timestamp = Date.now()
      const outputPath = path.join(outputDir, `signature-test-${timestamp}.pdf`)
      
      await fs.writeFile(outputPath, result.applicationPDF)
      
      console.log('\n💾 Saved signature test PDF to:', outputPath)
      console.log('\n🔍 MANUAL VERIFICATION REQUIRED:')
      console.log('   1. Open the PDF file above')
      console.log('   2. Look for a signature field containing: "John Michael Doe"')
      console.log('   3. Check that signature date fields are filled')
      console.log('   4. Verify the signature appears in the correct location')
      
      return true
      
    } else {
      console.error('❌ Unexpected result type:', typeof result)
      return false
    }
    
  } catch (error: any) {
    console.error('❌ Signature test failed:')
    console.error('Error:', error.message)
    
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    
    return false
  }
}

async function main() {
  console.log('🚀 Starting Signature PDF Test...')
  
  // Load environment variables
  await loadEnvVars()
  
  const success = await testSignaturePDF()
  
  if (success) {
    console.log('\n🎉 SUCCESS: Signature test completed!')
    console.log('\n📋 Next Steps:')
    console.log('   1. ✅ PDF generated with signature data')
    console.log('   2. 🔍 Check the output PDF manually')
    console.log('   3. ✅ Verify signature field shows "John Michael Doe"')
    console.log('   4. ✅ Verify signature date is filled')
    console.log('\n💡 If signature appears correctly, the fix is working!')
  } else {
    console.log('\n❌ FAILURE: Signature test failed')
    console.log('\n🔧 Debug the error messages above')
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { testSignaturePDF, signatureTestData }