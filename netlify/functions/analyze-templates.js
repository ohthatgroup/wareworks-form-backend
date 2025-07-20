// netlify/functions/analyze-templates.js
// Template Analysis Tool - Check for fillable form fields

const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

/**
 * Analyze PDF templates for fillable form fields
 */
async function analyzeTemplates() {
    try {
        console.log('Starting template analysis...');
        
        // Analyze both templates
        const applicationAnalysis = await analyzeTemplate('Wareworks Application.pdf');
        const i9Analysis = await analyzeTemplate('i-9.pdf');
        
        return {
            applicationTemplate: applicationAnalysis,
            i9Template: i9Analysis
        };
        
    } catch (error) {
        console.error('Template analysis error:', error);
        throw error;
    }
}

/**
 * Analyze a single PDF template
 */
async function analyzeTemplate(filename) {
    try {
        console.log(`\n=== Analyzing ${filename} ===`);
        
        const templatePath = path.join(__dirname, '../../Templates', filename);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${filename}`);
        }
        
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        
        console.log(`Pages: ${pdfDoc.getPageCount()}`);
        
        // Get the form from the PDF
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        
        console.log(`Form fields found: ${fields.length}`);
        
        const fieldInfo = [];
        
        fields.forEach((field, index) => {
            const fieldName = field.getName();
            const fieldType = field.constructor.name;
            
            let fieldDetails = {
                index: index,
                name: fieldName,
                type: fieldType,
                isReadOnly: field.isReadOnly ? field.isReadOnly() : false
            };
            
            // Get type-specific information
            if (fieldType === 'PDFTextField') {
                fieldDetails.maxLength = field.getMaxLength ? field.getMaxLength() : 'unlimited';
                fieldDetails.currentValue = field.getText ? field.getText() : '';
                fieldDetails.isMultiline = field.isMultiline ? field.isMultiline() : false;
            } else if (fieldType === 'PDFCheckBox') {
                fieldDetails.isChecked = field.isChecked ? field.isChecked() : false;
            } else if (fieldType === 'PDFRadioGroup') {
                fieldDetails.options = field.getOptions ? field.getOptions() : [];
                fieldDetails.selectedOption = field.getSelected ? field.getSelected() : null;
            } else if (fieldType === 'PDFDropdown') {
                fieldDetails.options = field.getOptions ? field.getOptions() : [];
                fieldDetails.selectedOption = field.getSelected ? field.getSelected() : null;
            }
            
            fieldInfo.push(fieldDetails);
            
            console.log(`  ${index + 1}. ${fieldName} (${fieldType})`);
            if (fieldDetails.currentValue) {
                console.log(`     Current value: "${fieldDetails.currentValue}"`);
            }
            if (fieldDetails.options && fieldDetails.options.length > 0) {
                console.log(`     Options: ${fieldDetails.options.join(', ')}`);
            }
        });
        
        return {
            filename: filename,
            pageCount: pdfDoc.getPageCount(),
            fieldCount: fields.length,
            fields: fieldInfo,
            hasForm: fields.length > 0
        };
        
    } catch (error) {
        console.error(`Error analyzing ${filename}:`, error);
        return {
            filename: filename,
            error: error.message,
            hasForm: false,
            fields: []
        };
    }
}

/**
 * Main handler for the analysis function
 */
exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    try {
        // Handle preflight requests
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        // Only allow GET requests
        if (event.httpMethod !== 'GET') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method Not Allowed' })
            };
        }

        const analysis = await analyzeTemplates();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                analysis: analysis,
                summary: {
                    applicationHasForm: analysis.applicationTemplate.hasForm,
                    applicationFieldCount: analysis.applicationTemplate.fieldCount,
                    i9HasForm: analysis.i9Template.hasForm,
                    i9FieldCount: analysis.i9Template.fieldCount,
                    totalFields: analysis.applicationTemplate.fieldCount + analysis.i9Template.fieldCount
                }
            }, null, 2)
        };

    } catch (error) {
        console.error('Analysis handler error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

// Export the analysis function for use in other modules
exports.analyzeTemplates = analyzeTemplates;
exports.analyzeTemplate = analyzeTemplate;