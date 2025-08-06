import { PDFService } from '../shared/services/PDFService'
import { ValidatedApplicationData } from '../shared/validation/schemas'
import * as fs from 'fs/promises'
import * as path from 'path'

async function testSignatureFont() {
  console.log('🖊️ Testing signature font in PDF generation')
  
  try {
    // Create a minimal test application data with signature
    const testData: ValidatedApplicationData = {
      submissionId: 'test-signature-font',
      legalFirstName: 'John',
      legalLastName: 'Doe',
      middleInitial: 'A',
      streetAddress: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345',
      phoneNumber: '555-1234',
      email: 'john.doe@test.com',
      dateOfBirth: '1990-01-01',
      socialSecurityNumber: '123-45-6789',
      
      // Add signature data
      signature: 'John A. Doe',
      signatureDate: new Date().toISOString(),
      
      // Minimal required fields
      citizenshipStatus: 'us_citizen',
      age18: 'yes',
      transportation: 'yes',
      workAuthorizationConfirm: 'yes',
      fullTimeEmployment: 'yes',
      swingShifts: 'no',
      graveyardShifts: 'no',
      previouslyApplied: 'no',
      forkliftCertification: 'no',
      
      // Empty arrays for optional sections
      education: [],
      employment: [],
      documents: [],
      
      // Availability
      availabilitySunday: 'Not Available',
      availabilityMonday: '9AM-5PM',
      availabilityTuesday: '9AM-5PM',
      availabilityWednesday: '9AM-5PM',
      availabilityThursday: '9AM-5PM',
      availabilityFriday: '9AM-5PM',
      availabilitySaturday: 'Not Available',
      
      // Emergency contact
      emergencyName: 'Jane Doe',
      emergencyPhone: '555-5678',
      emergencyRelationship: 'Spouse'
    }
    
    console.log('📄 Generating PDF with handwriting signature font...')
    const pdfService = new PDFService()
    const result = await pdfService.generateApplicationPDF(testData)
    
    // Save the test PDF with timestamp to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputPath = path.join(process.cwd(), `test-signature-output-${timestamp}.pdf`)
    
    if (Buffer.isBuffer(result)) {
      await fs.writeFile(outputPath, result)
      console.log(`✅ Test PDF saved to: ${outputPath}`)
    } else if (result.applicationPDF) {
      await fs.writeFile(outputPath, result.applicationPDF)
      console.log(`✅ Test PDF saved to: ${outputPath}`)
    }
    
    console.log('🖊️ Signature font test completed successfully!')
    console.log('👀 Open the PDF to verify the signature appears in handwriting font')
    
  } catch (error) {
    console.error('❌ Signature font test failed:', error)
    process.exit(1)
  }
}

// Run the test
testSignatureFont()