#!/usr/bin/env tsx

/**
 * Inspect PDF Template Fields
 * 
 * This script inspects the PDF template to see what fields actually exist,
 * particularly looking for signature-related fields.
 */

import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs/promises'  
import * as path from 'path'

async function inspectPDFFields() {
  console.log('🔍 Inspecting PDF Template Fields...')
  console.log('=' .repeat(50))
  
  try {
    // Load the PDF template
    const templatePath = path.join(process.cwd(), 'apps', 'form-app', 'public', 'templates', 'Wareworks Application.pdf')
    console.log('📁 Loading template:', templatePath)
    
    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    
    // Get all fields
    const fields = form.getFields()
    console.log(`\n📋 Found ${fields.length} total fields in PDF template`)
    
    // Look for signature-related fields
    console.log('\n🖊️ Looking for signature-related fields...')
    const signatureFields = fields.filter(field => {
      const name = field.getName().toLowerCase()
      return name.includes('sign') || name.includes('signature') || name.includes('applicant')
    })
    
    if (signatureFields.length > 0) {
      console.log(`✅ Found ${signatureFields.length} signature-related fields:`)
      signatureFields.forEach(field => {
        console.log(`   📝 "${field.getName()}" (${field.constructor.name})`)
      })
    } else {
      console.log('❌ No signature-related fields found')
    }
    
    // Look for date-related fields that might be signature dates
    console.log('\n📅 Looking for date-related fields...')
    const dateFields = fields.filter(field => {
      const name = field.getName().toLowerCase()
      return name.includes('date') || name.includes('month') || name.includes('day') || name.includes('year')
    })
    
    if (dateFields.length > 0) {
      console.log(`✅ Found ${dateFields.length} date-related fields:`)
      dateFields.forEach(field => {
        console.log(`   📅 "${field.getName()}" (${field.constructor.name})`)
      })
    }
    
    // Show ALL field names for comprehensive analysis
    console.log('\n📋 All field names in PDF template:')
    console.log('─'.repeat(50))
    fields.forEach((field, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. "${field.getName()}" (${field.constructor.name})`)
    })
    
    return true
    
  } catch (error: any) {
    console.error('❌ Failed to inspect PDF fields:')
    console.error('Error:', error.message)
    
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    
    return false
  }
}

async function main() {
  console.log('🚀 Starting PDF Field Inspection...')
  
  const success = await inspectPDFFields()
  
  if (success) {
    console.log('\n🎉 SUCCESS: PDF field inspection completed!')
    console.log('\n📋 Next Steps:')
    console.log('   1. ✅ Review the field names above')
    console.log('   2. 🔍 Look for the actual signature field name')
    console.log('   3. 🔧 Update pdfFieldMappings.ts with correct field name')
    console.log('   4. 🧪 Re-test signature functionality')
  } else {
    console.log('\n❌ FAILURE: Could not inspect PDF fields')
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { inspectPDFFields }