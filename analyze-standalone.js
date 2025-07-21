// Standalone Template Analyzer
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function analyzeTemplate(filename) {
    try {
        console.log(`\n=== Analyzing ${filename} ===`);
        
        const templatePath = path.join(__dirname, 'Templates', filename);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${filename}`);
        }
        
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        
        console.log(`Pages: ${pdfDoc.getPageCount()}`);
        
        // Get the form from the PDF
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        
        console.log(`Total form fields: ${fields.length}`);
        
        const fieldDetails = [];
        
        fields.forEach((field, index) => {
            const fieldName = field.getName();
            const fieldType = field.constructor.name;
            
            let fieldValue = '';
            try {
                if (fieldType === 'PDFTextField') {
                    fieldValue = field.getText();
                } else if (fieldType === 'PDFCheckBox') {
                    fieldValue = field.isChecked() ? 'checked' : 'unchecked';
                } else if (fieldType === 'PDFRadioGroup') {
                    fieldValue = field.getSelected();
                } else if (fieldType === 'PDFDropdown') {
                    fieldValue = field.getSelected();
                }
            } catch (e) {
                fieldValue = 'N/A';
            }
            
            const detail = {
                index: index + 1,
                name: fieldName,
                type: fieldType,
                value: fieldValue
            };
            
            fieldDetails.push(detail);
            console.log(`${index + 1}. ${fieldName} (${fieldType}) = "${fieldValue}"`);
        });
        
        return {
            filename,
            pageCount: pdfDoc.getPageCount(),
            fieldCount: fields.length,
            fields: fieldDetails
        };
        
    } catch (error) {
        console.error(`Error analyzing ${filename}:`, error.message);
        return { filename, error: error.message };
    }
}

async function main() {
    console.log('PDF Template Analysis');
    console.log('====================');
    
    try {
        const applicationAnalysis = await analyzeTemplate('Wareworks Application.pdf');
        const i9Analysis = await analyzeTemplate('i-9.pdf');
        
        console.log('\n=== SUMMARY ===');
        console.log(`Application Template: ${applicationAnalysis.fieldCount || 0} fields`);
        console.log(`I-9 Template: ${i9Analysis.fieldCount || 0} fields`);
        
        // Save detailed analysis to file
        const analysis = {
            applicationTemplate: applicationAnalysis,
            i9Template: i9Analysis,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync('template-analysis.json', JSON.stringify(analysis, null, 2));
        console.log('\nDetailed analysis saved to template-analysis.json');
        
    } catch (error) {
        console.error('Analysis failed:', error.message);
    }
}

main();