#!/usr/bin/env tsx

/**
 * Debug Signature Location in PDF
 * 
 * This script tries to find the actual location of the signature field
 * and tests different approaches to place the signature text.
 */

import { PDFDocument, rgb } from 'pdf-lib'
import * as fs from 'fs/promises'  
import * as path from 'path'

async function debugSignatureLocation() {
  console.log('🔍 Debugging Signature Location...')
  console.log('=' .repeat(50))
  
  try {
    // Load the PDF template
    const templatePath = path.join(process.cwd(), 'apps', 'form-app', 'public', 'templates', 'Wareworks Application.pdf')
    console.log('📁 Loading template:', templatePath)
    
    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    const pages = pdfDoc.getPages()
    
    console.log(`📄 PDF has ${pages.length} pages`)
    
    // Try to get the signature field and its properties
    try {
      const signatureField = form.getField('Signature')
      console.log('🖊️ Found signature field:', signatureField.constructor.name)
      
      // Try to get field properties if available
      if ('acroField' in signatureField) {
        const acroField = (signatureField as any).acroField
        if (acroField && acroField.Rect) {
          const rect = acroField.Rect()
          console.log('📍 Signature field rectangle:', rect)
        }
      }
    } catch (error) {
      console.log('❌ Could not get signature field properties:', error.message)
    }
    
    // Create a test PDF with signature text at multiple locations
    console.log('\n🧪 Creating test PDF with signature at multiple locations...')
    
    const lastPage = pages[pages.length - 1]
    const { width, height } = lastPage.getSize()
    console.log(`📏 Last page dimensions: ${width} x ${height}`)
    
    // Test signature at different locations
    const testSignature = 'John Michael Doe TEST'
    const locations = [
      { x: 100, y: 150, label: 'Bottom Left' },
      { x: 100, y: 200, label: 'Lower Left' },
      { x: 100, y: 300, label: 'Mid Left' },
      { x: 300, y: 150, label: 'Bottom Center' },
      { x: 300, y: 200, label: 'Lower Center' },
      { x: 400, y: 100, label: 'Bottom Right' },
      { x: 100, y: height - 100, label: 'Top Left' },
      { x: 300, y: height - 100, label: 'Top Center' },
    ]
    
    locations.forEach((loc, index) => {
      lastPage.drawText(`${index + 1}. ${testSignature} (${loc.label})`, {
        x: loc.x,
        y: loc.y,
        size: 12,
        color: rgb(0, 0, 1), // Blue for visibility
      })
      console.log(`📍 Placed signature #${index + 1} at (${loc.x}, ${loc.y}) - ${loc.label}`)
    })
    
    // Also try to draw on other pages if signature might be elsewhere
    pages.forEach((page, pageIndex) => {
      if (pageIndex !== pages.length - 1) { // Not the last page
        page.drawText(`PAGE ${pageIndex + 1}: ${testSignature}`, {
          x: 100,
          y: 100,
          size: 10,
          color: rgb(1, 0, 0), // Red for page identification
        })
      }
    })
    
    // Save the debug PDF
    const pdfBytes = await pdfDoc.save()
    const outputDir = path.join(process.cwd(), 'scripts', 'output')
    await fs.mkdir(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, `signature-location-debug-${Date.now()}.pdf`)
    await fs.writeFile(outputPath, pdfBytes)
    
    console.log('\n💾 Saved debug PDF to:', outputPath)
    console.log('\n🔍 Manual Check Required:')
    console.log('   1. Open the debug PDF')
    console.log('   2. Look for numbered blue signature texts')
    console.log('   3. Find which location is closest to the actual signature field')
    console.log('   4. Note the coordinates for the best placement')
    
    return true
    
  } catch (error: any) {
    console.error('❌ Failed to debug signature location:')
    console.error('Error:', error.message)
    
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    
    return false
  }
}

async function main() {
  console.log('🚀 Starting Signature Location Debug...')
  
  const success = await debugSignatureLocation()
  
  if (success) {
    console.log('\n🎉 SUCCESS: Debug PDF created!')
    console.log('\n📋 Next Steps:')
    console.log('   1. ✅ Open the debug PDF file')
    console.log('   2. 🔍 Find the best signature location')
    console.log('   3. 🔧 Update coordinates in PDFService.ts')
    console.log('   4. 🧪 Re-test signature functionality')
  } else {
    console.log('\n❌ FAILURE: Could not create debug PDF')
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { debugSignatureLocation }