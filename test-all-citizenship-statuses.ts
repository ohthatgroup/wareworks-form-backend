#!/usr/bin/env tsx

/**
 * Test All 4 Citizenship Statuses for I-9 Form
 * Verifies the field mapping analysis citizenship handling
 */

import { PDFService } from './shared/services/PDFService'
import { ValidatedApplicationData } from './shared/validation/schemas'
import * as fs from 'fs/promises'
import * as path from 'path'

// Load environment variables
async function loadEnvVars() {
  try {
    const envPath = path.join(process.cwd(), 'apps', 'form-app', '.env.local')
    const envContent = await fs.readFile(envPath, 'utf-8')
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=')
        }
      }
    })
  } catch (error) {
    console.warn('⚠️ Could not load .env.local file')
  }
}

// Base test data
const baseTestData: Omit<ValidatedApplicationData, 'citizenshipStatus'> = {
  submissionId: 'CITIZENSHIP-TEST-' + Date.now(),
  submittedAt: new Date().toISOString(),
  legalFirstName: 'Test',
  legalLastName: 'User',
  middleInitial: 'T',
  dateOfBirth: '1990-01-01',
  streetAddress: '123 Test St',
  city: 'Test City',
  state: 'WA',
  zipCode: '12345',
  phoneNumber: '555-0123',
  homePhone: '555-0123',
  email: 'test@example.com',
  socialSecurityNumber: '123-45-6789',
  positionApplied: 'Test Position',
  documents: []
}

async function testCitizenshipStatus(
  status: string, 
  additionalData: Partial<ValidatedApplicationData> = {}
): Promise<void> {
  console.log(`\\n🧪 Testing citizenship status: "${status}"`)
  console.log('='.repeat(50))
  
  const testData: ValidatedApplicationData = {
    ...baseTestData,
    citizenshipStatus: status,
    ...additionalData
  }
  
  try {
    const pdfService = new PDFService()
    const result = await pdfService.generateApplicationPDF(testData)
    
    // Save test PDF
    const outputDir = path.join(__dirname, 'test-output')
    if (!fs.existsSync) {
      await fs.mkdir(outputDir, { recursive: true }).catch(() => {})
    }
    
    if (Buffer.isBuffer(result)) {
      const outputPath = path.join(outputDir, `citizenship-test-${status}-${Date.now()}.pdf`)
      await fs.writeFile(outputPath, result)
      console.log(`✅ Generated PDF: ${status} (${(result.length / 1024).toFixed(1)}KB)`)
    } else {
      const appPath = path.join(outputDir, `citizenship-test-${status}-app-${Date.now()}.pdf`)
      const i9Path = path.join(outputDir, `citizenship-test-${status}-i9-${Date.now()}.pdf`)
      await fs.writeFile(appPath, result.applicationPDF)
      await fs.writeFile(i9Path, result.i9PDF)
      console.log(`✅ Generated PDFs: ${status}`)
      console.log(`   Application: ${(result.applicationPDF.length / 1024).toFixed(1)}KB`)
      console.log(`   I-9: ${(result.i9PDF.length / 1024).toFixed(1)}KB`)
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${status}:`, error.message)
  }
}

async function main() {
  await loadEnvVars()
  
  console.log('🔍 COMPREHENSIVE CITIZENSHIP STATUS TEST')
  console.log('Testing all 4 citizenship statuses from field mapping analysis')
  console.log('='.repeat(60))
  
  // Test 1: US Citizen
  await testCitizenshipStatus('us_citizen')
  
  // Test 2: Non-citizen National  
  await testCitizenshipStatus('noncitizen_national')
  
  // Test 3: Lawful Permanent Resident (with USCIS A-Number)
  await testCitizenshipStatus('lawful_permanent', {
    uscisANumber: 'A123456789'
  })
  
  // Test 4: Permanent Resident (alternative format)
  await testCitizenshipStatus('permanent_resident', {
    uscisANumber: 'A987654321'
  })
  
  // Test 5: Alien Authorized to Work (with work auth documents)
  await testCitizenshipStatus('alien_authorized', {
    workAuthorizationExpiration: '2025-12-31',
    alienDocumentType: 'uscis_a_number',
    alienDocumentNumber: 'A555666777'
  })
  
  console.log('\\n🎉 All citizenship status tests completed!')
  console.log('\\n📋 Expected Results:')
  console.log('  • us_citizen → CB_1 checked')
  console.log('  • noncitizen_national → CB_2 checked')  
  console.log('  • lawful_permanent → CB_3 checked + USCIS A-Number filled')
  console.log('  • permanent_resident → CB_3 checked + USCIS A-Number filled')
  console.log('  • alien_authorized → CB_4 checked + work auth fields filled')
}

main().catch(console.error)