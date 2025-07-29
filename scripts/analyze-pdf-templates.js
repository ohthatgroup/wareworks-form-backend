#!/usr/bin/env node

/**
 * PDF Template Field Analysis Tool
 * 
 * This script analyzes PDF template forms to extract actual field names,
 * replacing the guessed field mappings with real field names from the templates.
 */

const { PDFDocument } = require('pdf-lib')
const fs = require('fs').promises
const path = require('path')

async function analyzePDFTemplate(templatePath, outputName) {
  try {
    console.log(`\n🔍 Analyzing ${outputName}...`)
    console.log(`📁 File: ${templatePath}`)
    
    // Check if file exists
    try {
      await fs.access(templatePath)
    } catch (error) {
      console.error(`❌ File not found: ${templatePath}`)
      return null
    }
    
    // Load the PDF
    const templateBytes = await fs.readFile(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    
    // Get all form fields
    const fields = form.getFields()
    console.log(`📝 Found ${fields.length} form fields`)
    
    const analysis = {
      templateName: outputName,
      templatePath: templatePath,
      totalFields: fields.length,
      textFields: [],
      checkboxFields: [],
      dropdownFields: [],
      buttonFields: [],
      unknownFields: [],
      analysisDate: new Date().toISOString()
    }
    
    // Analyze each field
    fields.forEach((field, index) => {
      const fieldInfo = {
        index: index + 1,
        name: field.getName(),
        type: field.constructor.name,
        isReadOnly: field.isReadOnly ? field.isReadOnly() : false
      }
      
      // Add type-specific information
      if (field.constructor.name === 'PDFTextField') {
        fieldInfo.maxLength = field.getMaxLength ? field.getMaxLength() : 'unlimited'
        fieldInfo.defaultValue = field.getText ? field.getText() : ''
        analysis.textFields.push(fieldInfo)
      } else if (field.constructor.name === 'PDFCheckBox') {
        fieldInfo.isChecked = field.isChecked ? field.isChecked() : false
        analysis.checkboxFields.push(fieldInfo)
      } else if (field.constructor.name === 'PDFDropdown') {
        fieldInfo.options = field.getOptions ? field.getOptions() : []
        fieldInfo.selectedValue = field.getSelected ? field.getSelected() : ''
        analysis.dropdownFields.push(fieldInfo)
      } else if (field.constructor.name === 'PDFButton') {
        analysis.buttonFields.push(fieldInfo)
      } else {
        analysis.unknownFields.push(fieldInfo)
      }
      
      console.log(`  ${index + 1}. "${field.getName()}" (${field.constructor.name})`)
    })
    
    // Print summary
    console.log(`\n📊 Field Summary for ${outputName}:`)
    console.log(`   Text fields: ${analysis.textFields.length}`)
    console.log(`   Checkbox fields: ${analysis.checkboxFields.length}`) 
    console.log(`   Dropdown fields: ${analysis.dropdownFields.length}`)
    console.log(`   Button fields: ${analysis.buttonFields.length}`)
    console.log(`   Unknown fields: ${analysis.unknownFields.length}`)
    
    return analysis
    
  } catch (error) {
    console.error(`❌ Error analyzing ${outputName}:`, error.message)
    return null
  }
}

async function generateFieldMappingSuggestions(wareWorksAnalysis, i9Analysis) {
  console.log(`\n🎯 Generating Field Mapping Suggestions...`)
  
  const suggestions = {
    generatedAt: new Date().toISOString(),
    wareWorksTemplate: {},
    i9Template: {},
    notes: []
  }
  
  if (wareWorksAnalysis) {
    console.log(`\n📋 WareWorks Application Field Suggestions:`)
    
    // Analyze WareWorks fields for common patterns
    const textFields = wareWorksAnalysis.textFields.map(f => f.name)
    console.log(`\nText Fields Found (${textFields.length}):`)
    textFields.forEach((name, i) => console.log(`  ${i + 1}. "${name}"`))
    
    suggestions.wareWorksTemplate = {
      totalFields: wareWorksAnalysis.totalFields,
      textFieldNames: textFields,
      checkboxFieldNames: wareWorksAnalysis.checkboxFields.map(f => f.name),
      dropdownFieldNames: wareWorksAnalysis.dropdownFields.map(f => f.name),
      fieldAnalysis: {
        // Look for name-related fields
        nameFields: textFields.filter(name => 
          name.toLowerCase().includes('name') || 
          name.toLowerCase().includes('first') || 
          name.toLowerCase().includes('last')
        ),
        // Look for address-related fields
        addressFields: textFields.filter(name => 
          name.toLowerCase().includes('address') || 
          name.toLowerCase().includes('street') || 
          name.toLowerCase().includes('city') || 
          name.toLowerCase().includes('state') || 
          name.toLowerCase().includes('zip')
        ),
        // Look for contact-related fields
        contactFields: textFields.filter(name => 
          name.toLowerCase().includes('phone') || 
          name.toLowerCase().includes('email') || 
          name.toLowerCase().includes('contact')
        ),
        // Look for employment-related fields
        employmentFields: textFields.filter(name => 
          name.toLowerCase().includes('company') || 
          name.toLowerCase().includes('employer') || 
          name.toLowerCase().includes('position') || 
          name.toLowerCase().includes('job')
        )
      }
    }
  }
  
  if (i9Analysis) {
    console.log(`\n📋 I-9 Form Field Suggestions:`)
    
    const textFields = i9Analysis.textFields.map(f => f.name)
    const checkboxFields = i9Analysis.checkboxFields.map(f => f.name)
    
    console.log(`\nText Fields Found (${textFields.length}):`)
    textFields.forEach((name, i) => console.log(`  ${i + 1}. "${name}"`))
    
    console.log(`\nCheckbox Fields Found (${checkboxFields.length}):`)
    checkboxFields.forEach((name, i) => console.log(`  ${i + 1}. "${name}"`))
    
    suggestions.i9Template = {
      totalFields: i9Analysis.totalFields,
      textFieldNames: textFields,
      checkboxFieldNames: checkboxFields,
      dropdownFieldNames: i9Analysis.dropdownFields.map(f => f.name)
    }
  }
  
  return suggestions
}

async function main() {
  console.log('🚀 Starting PDF Template Analysis...')
  console.log('=' .repeat(60))
  
  const baseDir = process.cwd()
  const templatesDir = path.join(baseDir, 'apps', 'form-app', 'public', 'templates')
  
  // Analyze both templates
  const wareWorksPath = path.join(templatesDir, 'Wareworks Application.pdf')
  const i9Path = path.join(templatesDir, 'i-9.pdf')
  
  const [wareWorksAnalysis, i9Analysis] = await Promise.all([
    analyzePDFTemplate(wareWorksPath, 'WareWorks Application'),
    analyzePDFTemplate(i9Path, 'I-9 Form')
  ])
  
  // Generate suggestions
  const suggestions = await generateFieldMappingSuggestions(wareWorksAnalysis, i9Analysis)
  
  // Save detailed analysis
  const outputDir = path.join(baseDir, 'scripts', 'output')
  await fs.mkdir(outputDir, { recursive: true })
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputFile = path.join(outputDir, `template-analysis-${timestamp}.json`)
  
  const fullAnalysis = {
    summary: suggestions,
    detailedAnalysis: {
      wareWorks: wareWorksAnalysis,
      i9: i9Analysis
    }
  }
  
  await fs.writeFile(outputFile, JSON.stringify(fullAnalysis, null, 2))
  
  console.log(`\n💾 Analysis saved to: ${outputFile}`)
  console.log(`\n✅ Analysis complete!`)
  console.log(`\n📝 Next Steps:`)
  console.log(`   1. Review the generated field names in the output file`)
  console.log(`   2. Update pdfFieldMappings.ts with actual field names`)
  console.log(`   3. Test PDF generation with real field names`)
  console.log(`   4. Compare form data fields with PDF template fields`)
  
  return fullAnalysis
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { analyzePDFTemplate, generateFieldMappingSuggestions }