import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs/promises'
import * as path from 'path'

async function findSignatureField() {
  console.log('🔍 Analyzing PDF to find signature field coordinates...')
  
  try {
    // Load the PDF template
    const baseDir = process.cwd()
    const templatePath = path.join(baseDir, 'apps', 'form-app', 'public', 'templates', 'Wareworks Application.pdf')
    
    console.log(`📁 Loading PDF from: ${templatePath}`)
    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    const pages = pdfDoc.getPages()
    
    console.log(`📄 PDF has ${pages.length} pages`)
    console.log(`📝 PDF has ${form.getFields().length} form fields`)
    
    // List all form fields first
    console.log('\n📋 All form fields:')
    const fields = form.getFields()
    fields.forEach((field, index) => {
      console.log(`  ${index + 1}. "${field.getName()}" (${field.constructor.name})`)
    })
    
    // Find the "Signature" field specifically
    console.log('\n🎯 Looking for "Signature" field...')
    
    try {
      const signatureField = form.getField('Signature')
      console.log(`✅ Found field: "${signatureField.getName()}"`)
      console.log(`   Type: ${signatureField.constructor.name}`)
      
      // Get field widgets (visual representations on pages)
      const widgets = (signatureField as any).acroField.getWidgets()
      console.log(`   Widgets: ${widgets.length}`)
      
      widgets.forEach((widget, widgetIndex) => {
        const rect = widget.getRectangle()
        const pageRef = widget.P()
        
        // Find which page this widget is on
        let pageNumber = -1
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].ref === pageRef) {
            pageNumber = i + 1 // Convert to 1-based
            break
          }
        }
        
        console.log(`\n📍 Widget ${widgetIndex + 1} (Page ${pageNumber}):`)
        console.log(`   X: ${rect.x}`)
        console.log(`   Y: ${rect.y}`)
        console.log(`   Width: ${rect.width}`)
        console.log(`   Height: ${rect.height}`)
        console.log(`   Bottom-left: (${rect.x}, ${rect.y})`)
        console.log(`   Top-right: (${rect.x + rect.width}, ${rect.y + rect.height})`)
        
        // Calculate page height for context
        const page = pages[pageNumber - 1]
        if (page) {
          const { height } = page.getSize()
          console.log(`   Page height: ${height}`)
          console.log(`   Distance from top: ${height - (rect.y + rect.height)}`)
          console.log(`   Distance from bottom: ${rect.y}`)
        }
      })
      
    } catch (error) {
      console.error('❌ Could not find "Signature" field:', error)
      
      // Try alternative field names
      const possibleNames = ['Applicant Signature', 'signature', 'Sign', 'Signature Field']
      console.log('\n🔍 Trying alternative field names...')
      
      for (const name of possibleNames) {
        try {
          const field = form.getField(name)
          console.log(`✅ Found alternative field: "${field.getName()}"`)
          // Same analysis as above...
        } catch (e) {
          console.log(`❌ "${name}" not found`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error analyzing PDF:', error)
  }
}

// Run the analysis
findSignatureField()