// netlify/functions/submit-application.js
// WareWorks Form Submission Handler with PDF Generation

const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const moment = require('moment');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the incoming data
    const data = JSON.parse(event.body);
    
    // Add server-side metadata
    data.serverTimestamp = new Date().toISOString();
    data.submissionId = generateSubmissionId();
    data.serverValidated = true;
    data.ipAddress = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    data.userAgent = event.headers['user-agent'] || 'unknown';
    
    console.log(`Form submission received: ${data.submissionId}`);
    
    // Validate required fields
    const validation = validateSubmission(data);
    if (!validation.isValid) {
      console.log(`Validation failed: ${validation.errors.join(', ')}`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Validation failed: ' + validation.errors.join(', ')
        })
      };
    }

    // Initialize results object
    const results = {
      submissionId: data.submissionId,
      timestamp: data.serverTimestamp,
      results: {}
    };

    // Save to Google Sheets if enabled
    if (process.env.ENABLE_GOOGLE_SHEETS === 'true') {
      try {
        const sheetResult = await saveToGoogleSheets(data);
        results.results.googleSheets = sheetResult;
        console.log('Data saved to Google Sheets successfully');
      } catch (error) {
        console.error('Google Sheets save failed:', error);
        results.results.googleSheets = { success: false, error: error.message };
      }
    }

    // Generate PDF if enabled
    let pdfBuffer = null;
    if (process.env.ENABLE_PDF_GENERATION === 'true') {
      try {
        pdfBuffer = await generateApplicationPDF(data);
        results.results.pdfGeneration = { success: true, size: pdfBuffer.length };
        console.log('PDF generated successfully');
      } catch (error) {
        console.error('PDF generation failed:', error);
        results.results.pdfGeneration = { success: false, error: error.message };
      }
    }

    // Send admin notification with PDF
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
      try {
        await sendAdminNotificationWithPDF(data, pdfBuffer);
        results.results.adminNotification = { success: true };
        console.log('Admin notification sent successfully');
      } catch (error) {
        console.error('Admin notification failed:', error);
        results.results.adminNotification = { success: false, error: error.message };
      }
    }

    console.log(`Form submission successful: ${data.submissionId}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id: data.submissionId,
        message: 'Application submitted successfully',
        details: results
      })
    };

  } catch (error) {
    console.error('Form submission error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error: ' + error.message
      })
    };
  }
};

// Utility Functions
function generateSubmissionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `WW_${timestamp}_${random}`;
}

function validateSubmission(data) {
  const errors = [];
  
  // Required fields validation
  const requiredFields = [
    'legalFirstName',
    'legalLastName', 
    'streetAddress',
    'city',
    'state',
    'zipCode',
    'phoneNumber',
    'socialSecurityNumber'
  ];
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Email validation (if provided)
  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // SSN validation
  if (data.socialSecurityNumber && !/^\d{3}-\d{2}-\d{4}$/.test(data.socialSecurityNumber)) {
    errors.push('Invalid Social Security Number format');
  }
  
  // Phone number validation
  if (data.phoneNumber && !/^\d{3}-\d{3}-\d{4}$/.test(data.phoneNumber)) {
    errors.push('Invalid phone number format');
  }
  
  // ZIP code validation
  if (data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
    errors.push('Invalid ZIP code format');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

async function saveToGoogleSheets(data) {
  try {
    // Google Sheets API setup
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // Check if headers exist, if not create them
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Wareworks Submissions!A1:AZ1'
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await createSheetHeaders(sheets, spreadsheetId);
    }

    // Prepare row data
    const rowData = [
      data.submissionId,
      data.serverTimestamp,
      data.language || 'en',
      data.legalFirstName || '',
      data.middleInitial || '',
      data.legalLastName || '',
      data.otherLastNames || '',
      data.streetAddress || '',
      data.aptNumber || '',
      data.city || '',
      data.state || '',
      data.zipCode || '',
      data.phoneNumber || '',
      data.socialSecurityNumber || '',
      data.dateOfBirth || '',
      data.email || '',
      data.homePhone || '',
      data.cellPhone || '',
      data.emergencyName || '',
      data.emergencyPhone || '',
      data.emergencyRelationship || '',
      data.citizenshipStatus || '',
      data.uscisANumber || '',
      data.workAuthExpiration || '',
      data.alienDocumentType || '',
      data.alienDocumentNumber || '',
      data.documentCountry || '',
      data.age18 || '',
      data.transportation || '',
      data.workAuthorization || '',
      data.positionApplied || '',
      data.expectedSalary || '',
      data.jobDiscovery || '',
      data.previouslyApplied || '',
      data.previousApplicationWhen || '',
      JSON.stringify(data.education || []),
      JSON.stringify(data.employment || []),
      JSON.stringify(data.auditLog || []),
      data.ipAddress || '',
      data.userAgent || ''
    ];

    // Append the row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Wareworks Submissions!A:AZ',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [rowData]
      }
    });

    return { success: true, message: 'Data saved to Google Sheets' };

  } catch (error) {
    console.error('Google Sheets save error:', error);
    throw new Error('Failed to save to Google Sheets: ' + error.message);
  }
}

async function createSheetHeaders(sheets, spreadsheetId) {
  const headers = [
    'Submission ID',
    'Timestamp',
    'Language',
    'Legal First Name',
    'Middle Initial',
    'Legal Last Name',
    'Other Last Names',
    'Street Address',
    'Apt Number',
    'City',
    'State',
    'ZIP Code',
    'Phone Number',
    'SSN',
    'Date of Birth',
    'Email',
    'Home Phone',
    'Cell Phone',
    'Emergency Name',
    'Emergency Phone',
    'Emergency Relationship',
    'Citizenship Status',
    'USCIS A-Number',
    'Work Auth Expiration',
    'Alien Document Type',
    'Alien Document Number',
    'Document Country',
    'Age 18+',
    'Transportation',
    'Work Authorization',
    'Position Applied',
    'Expected Salary',
    'Job Discovery',
    'Previously Applied',
    'Previous Application Details',
    'Education History',
    'Employment History',
    'Audit Log',
    'IP Address',
    'User Agent'
  ];

  // Create the sheet if it doesn't exist
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: 'Wareworks Submissions'
            }
          }
        }]
      }
    });
  } catch (error) {
    // Sheet might already exist, continue
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Wareworks Submissions!A1:AM1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [headers]
    }
  });

  // Format headers
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [{
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: headers.length
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true
              },
              backgroundColor: {
                red: 0.9,
                green: 0.9,
                blue: 0.9
              }
            }
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor)'
        }
      }]
    }
  });
}

async function generateApplicationPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate the combined PDF
      generateWareWorksApplication(doc, data);
      doc.addPage();
      generateI9Form(doc, data);
      doc.addPage();
      generateIDVerificationForm(doc, data);

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

function generateWareWorksApplication(doc, data) {
  // WareWorks Application Header
  doc.fontSize(18).font('Helvetica-Bold').text('WAREWORKS APPLICATION FOR EMPLOYMENT', 50, 50);
  doc.fontSize(10).font('Helvetica').text('Equal Opportunity Employer', 50, 75);
  
  let y = 100;
  
  // Personal Information Section
  doc.fontSize(14).font('Helvetica-Bold').text('PERSONAL INFORMATION', 50, y);
  y += 25;
  
  doc.fontSize(10).font('Helvetica');
  doc.text(`Name: ${data.legalFirstName || ''} ${data.middleInitial || ''} ${data.legalLastName || ''}`, 50, y);
  y += 15;
  
  doc.text(`Address: ${data.streetAddress || ''} ${data.aptNumber || ''}`, 50, y);
  y += 15;
  
  doc.text(`City, State, ZIP: ${data.city || ''}, ${data.state || ''} ${data.zipCode || ''}`, 50, y);
  y += 15;
  
  doc.text(`Phone: ${data.phoneNumber || ''}`, 50, y);
  doc.text(`Email: ${data.email || 'Not provided'}`, 300, y);
  y += 15;
  
  doc.text(`Social Security Number: ${data.socialSecurityNumber || ''}`, 50, y);
  doc.text(`Date of Birth: ${data.dateOfBirth || 'Not provided'}`, 300, y);
  y += 30;
  
  // Emergency Contact
  if (data.emergencyName) {
    doc.fontSize(12).font('Helvetica-Bold').text('EMERGENCY CONTACT', 50, y);
    y += 20;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${data.emergencyName || ''}`, 50, y);
    doc.text(`Phone: ${data.emergencyPhone || ''}`, 300, y);
    y += 15;
    doc.text(`Relationship: ${data.emergencyRelationship || ''}`, 50, y);
    y += 30;
  }
  
  // Application Information
  doc.fontSize(12).font('Helvetica-Bold').text('APPLICATION INFORMATION', 50, y);
  y += 20;
  doc.fontSize(10).font('Helvetica');
  
  doc.text(`Position Applied For: ${data.positionApplied || 'Not specified'}`, 50, y);
  y += 15;
  doc.text(`Expected Salary: ${data.expectedSalary || 'Not specified'}`, 50, y);
  y += 15;
  doc.text(`How did you discover this job? ${data.jobDiscovery || 'Not specified'}`, 50, y);
  y += 15;
  
  doc.text(`Are you 18 or older? ${data.age18 || 'Not answered'}`, 50, y);
  y += 15;
  doc.text(`Do you have reliable transportation? ${data.transportation || 'Not answered'}`, 50, y);
  y += 15;
  doc.text(`Are you authorized to work in the US? ${data.workAuthorization || 'Not answered'}`, 50, y);
  y += 30;
  
  // Education History
  if (data.education && data.education.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('EDUCATION HISTORY', 50, y);
    y += 20;
    doc.fontSize(10).font('Helvetica');
    
    data.education.forEach((edu, index) => {
      if (edu.schoolName) {
        doc.text(`${index + 1}. ${edu.schoolName} (${edu.year || 'N/A'})`, 50, y);
        y += 15;
        if (edu.major) {
          doc.text(`   Major: ${edu.major}`, 50, y);
          y += 15;
        }
        if (edu.diploma) {
          doc.text(`   Diploma/Degree: ${edu.diploma}`, 50, y);
          y += 15;
        }
        y += 10;
      }
    });
    y += 20;
  }
  
  // Employment History
  if (data.employment && data.employment.length > 0) {
    if (y > 650) {
      doc.addPage();
      y = 50;
    }
    
    doc.fontSize(12).font('Helvetica-Bold').text('EMPLOYMENT HISTORY', 50, y);
    y += 20;
    doc.fontSize(10).font('Helvetica');
    
    data.employment.forEach((emp, index) => {
      if (emp.companyName) {
        doc.text(`${index + 1}. ${emp.companyName}`, 50, y);
        y += 15;
        doc.text(`   Dates: ${emp.startDate || 'N/A'} to ${emp.endDate || 'Present'}`, 50, y);
        y += 15;
        doc.text(`   Position: ${emp.startingPosition || 'N/A'} to ${emp.endingPosition || 'N/A'}`, 50, y);
        y += 15;
        if (emp.supervisorName) {
          doc.text(`   Supervisor: ${emp.supervisorName} (${emp.phoneNumber || 'No phone'})`, 50, y);
          y += 15;
        }
        if (emp.responsibilities) {
          doc.text(`   Responsibilities: ${emp.responsibilities}`, 50, y, { width: 500 });
          y += 30;
        }
        if (emp.reasonLeaving) {
          doc.text(`   Reason for leaving: ${emp.reasonLeaving}`, 50, y, { width: 500 });
          y += 20;
        }
        doc.text(`   May we contact this employer? ${emp.mayContact || 'Not answered'}`, 50, y);
        y += 30;
      }
    });
  }
  
  // Submission Information
  y += 30;
  doc.fontSize(10).font('Helvetica');
  doc.text(`Submission ID: ${data.submissionId}`, 50, y);
  y += 15;
  doc.text(`Submitted: ${moment(data.serverTimestamp).format('MMMM DD, YYYY at h:mm A')}`, 50, y);
  y += 15;
  doc.text(`Language: ${data.language === 'es' ? 'Spanish' : 'English'}`, 50, y);
}

function generateI9Form(doc, data) {
  // I-9 Form Header
  doc.fontSize(16).font('Helvetica-Bold').text('Employment Eligibility Verification', 50, 50);
  doc.fontSize(12).font('Helvetica').text('Department of Homeland Security', 50, 70);
  doc.text('U.S. Citizenship and Immigration Services', 50, 85);
  doc.fontSize(10).text('USCIS Form I-9', 50, 100);
  doc.text('OMB No. 1615-0047', 50, 115);
  doc.text('Expires 10/31/2025', 50, 130);
  
  let y = 160;
  
  // Section 1 Header
  doc.fontSize(14).font('Helvetica-Bold').text('Section 1. Employee Information and Attestation', 50, y);
  doc.fontSize(10).font('Helvetica').text('(Employees must complete and sign Section 1 of Form I-9 no later than the first day of employment, but not before accepting a job offer.)', 50, y + 15);
  
  y += 50;
  
  // Employee Information
  doc.fontSize(10).font('Helvetica');
  
  // Last Name, First Name, Middle Initial
  doc.text('Last Name (Family Name):', 50, y);
  doc.rect(180, y - 5, 150, 20).stroke();
  doc.text(data.legalLastName || '', 185, y);
  
  doc.text('First Name (Given Name):', 350, y);
  doc.rect(460, y - 5, 100, 20).stroke();
  doc.text(data.legalFirstName || '', 465, y);
  
  y += 30;
  
  doc.text('Middle Initial:', 50, y);
  doc.rect(130, y - 5, 50, 20).stroke();
  doc.text(data.middleInitial || '', 135, y);
  
  doc.text('Other Last Names Used:', 200, y);
  doc.rect(320, y - 5, 240, 20).stroke();
  doc.text(data.otherLastNames || '', 325, y);
  
  y += 30;
  
  // Address
  doc.text('Address (Street Number and Name):', 50, y);
  doc.rect(200, y - 5, 200, 20).stroke();
  doc.text(data.streetAddress || '', 205, y);
  
  doc.text('Apt. Number:', 420, y);
  doc.rect(480, y - 5, 80, 20).stroke();
  doc.text(data.aptNumber || '', 485, y);
  
  y += 30;
  
  doc.text('City or Town:', 50, y);
  doc.rect(120, y - 5, 150, 20).stroke();
  doc.text(data.city || '', 125, y);
  
  doc.text('State:', 290, y);
  doc.rect(320, y - 5, 80, 20).stroke();
  doc.text(data.state || '', 325, y);
  
  doc.text('ZIP Code:', 420, y);
  doc.rect(470, y - 5, 90, 20).stroke();
  doc.text(data.zipCode || '', 475, y);
  
  y += 30;
  
  doc.text('Date of Birth (mm/dd/yyyy):', 50, y);
  doc.rect(180, y - 5, 120, 20).stroke();
  doc.text(data.dateOfBirth || '', 185, y);
  
  doc.text('U.S. Social Security Number:', 320, y);
  doc.rect(460, y - 5, 100, 20).stroke();
  doc.text(data.socialSecurityNumber || '', 465, y);
  
  y += 30;
  
  doc.text('Employee\'s E-mail Address:', 50, y);
  doc.rect(180, y - 5, 200, 20).stroke();
  doc.text(data.email || '', 185, y);
  
  doc.text('Employee\'s Telephone Number:', 400, y);
  doc.rect(520, y - 5, 100, 20).stroke();
  doc.text(data.phoneNumber || '', 525, y);
  
  y += 50;
  
  // Citizenship Status Section
  doc.fontSize(11).font('Helvetica-Bold').text('I am aware that federal law provides for imprisonment and/or fines for false statements or use of false documents in connection with the completion of this form.', 50, y, { width: 500 });
  
  y += 30;
  
  doc.fontSize(10).font('Helvetica').text('I attest, under penalty of perjury, that I am (check one of the following boxes):', 50, y);
  
  y += 20;
  
  // Citizenship checkboxes
  const citizenshipStatus = data.citizenshipStatus || '';
  
  doc.rect(50, y, 10, 10).stroke();
  if (citizenshipStatus === 'us_citizen') doc.text('✓', 52, y + 1);
  doc.text('1. A citizen of the United States', 70, y + 2);
  
  y += 20;
  
  doc.rect(50, y, 10, 10).stroke();
  if (citizenshipStatus === 'noncitizen_national') doc.text('✓', 52, y + 1);
  doc.text('2. A noncitizen national of the United States (See instructions)', 70, y + 2);
  
  y += 20;
  
  doc.rect(50, y, 10, 10).stroke();
  if (citizenshipStatus === 'lawful_permanent') doc.text('✓', 52, y + 1);
  doc.text('3. A lawful permanent resident (Alien Registration Number/USCIS Number):', 70, y + 2);
  doc.rect(380, y - 2, 120, 15).stroke();
  doc.text(data.uscisANumber || '', 385, y + 2);
  
  y += 20;
  
  doc.rect(50, y, 10, 10).stroke();
  if (citizenshipStatus === 'alien_authorized') doc.text('✓', 52, y + 1);
  doc.text('4. An alien authorized to work until (expiration date, if applicable, mm/dd/yyyy):', 70, y + 2);
  doc.rect(380, y - 2, 120, 15).stroke();
  doc.text(data.workAuthExpiration || '', 385, y + 2);
  
  y += 30;
  
  // Signature section
  doc.text('Some aliens may write "N/A" in the expiration date field. (See instructions)', 70, y);
  
  y += 30;
  
  doc.text('Signature of Employee:', 50, y);
  doc.moveTo(180, y + 10).lineTo(350, y + 10).stroke();
  doc.text('Today\'s Date (mm/dd/yyyy):', 370, y);
  doc.moveTo(500, y + 10).lineTo(560, y + 10).stroke();
  
  y += 40;
  
  // Instructions
  doc.fontSize(8).font('Helvetica').text('If you did not check box 4 above, do not complete Section 2 and 3 below at this time.', 50, y);
  
  y += 20;
  
  // Note for admin
  doc.fontSize(10).font('Helvetica-Bold').text('ADMIN NOTE: Employee must sign this form manually. Complete Section 2 after verifying documents.', 50, y, { width: 500 });
}

function generateIDVerificationForm(doc, data) {
  // ID Verification Form Header
  doc.fontSize(16).font('Helvetica-Bold').text('IDENTIFICATION DOCUMENT VERIFICATION', 50, 50);
  doc.fontSize(12).font('Helvetica').text('For Administrative Use Only', 50, 75);
  
  let y = 110;
  
  // Employee Information
  doc.fontSize(12).font('Helvetica-Bold').text('EMPLOYEE INFORMATION', 50, y);
  y += 20;
  
  doc.fontSize(10).font('Helvetica');
  doc.text(`Employee Name: ${data.legalFirstName || ''} ${data.legalLastName || ''}`, 50, y);
  y += 15;
  doc.text(`Submission ID: ${data.submissionId}`, 50, y);
  y += 15;
  doc.text(`Date of Verification: _____________________`, 50, y);
  y += 30;
  
  // Document Requirements
  doc.fontSize(12).font('Helvetica-Bold').text('ACCEPTABLE DOCUMENTS FOR IDENTITY AND EMPLOYMENT AUTHORIZATION', 50, y);
  y += 20;
  
  doc.fontSize(10).font('Helvetica-Bold').text('LIST A - Documents that Establish Both Identity and Employment Authorization:', 50, y);
  y += 15;
  
  doc.fontSize(9).font('Helvetica');
  const listADocs = [
    '• U.S. Passport or U.S. Passport Card',
    '• Permanent Resident Card or Alien Registration Receipt Card (Form I-551)',
    '• Foreign passport that contains a temporary I-551 stamp or temporary I-551 printed notation on a machine-readable immigrant visa',
    '• Employment Authorization Document that contains a photograph (Form I-766)',
    '• For a nonimmigrant alien authorized to work for a specific employer because of his or her status: Foreign passport and Form I-94',
    '• Passport from the Federated States of Micronesia (FSM) or the Republic of the Marshall Islands (RMI) with Form I-94'
  ];
  
  listADocs.forEach(doc_item => {
    doc.text(doc_item, 50, y, { width: 500 });
    y += 12;
  });
  
  y += 15;
  
  doc.fontSize(10).font('Helvetica-Bold').text('LIST B - Documents that Establish Identity + LIST C - Documents that Establish Employment Authorization:', 50, y);
  y += 15;
  
  doc.fontSize(9).font('Helvetica-Bold').text('LIST B (Identity):', 50, y);
  y += 12;
  
  const listBDocs = [
    '• Driver\'s license or ID card issued by a State or outlying possession of the United States',
    '• ID card issued by federal, state or local government agencies or entities',
    '• School ID card with a photograph',
    '• Voter\'s registration card',
    '• U.S. Military card or draft record',
    '• Military dependent\'s ID card',
    '• U.S. Coast Guard Merchant Mariner Card',
    '• Native American tribal document',
    '• Driver\'s license issued by a Canadian government authority'
  ];
  
  listBDocs.forEach(doc_item => {
    doc.fontSize(8).font('Helvetica').text(doc_item, 50, y, { width: 240 });
    y += 10;
  });
  
  // Reset y for List C
  y = 250;
  
  doc.fontSize(9).font('Helvetica-Bold').text('LIST C (Employment Authorization):', 300, y);
  y += 12;
  
  const listCDocs = [
    '• A Social Security Account Number card, unless the card includes one of the restrictions',
    '• Certification of report of birth issued by the Department of State',
    '• Original or certified copy of birth certificate issued by a State, county, municipal authority, or territory',
    '• Native American tribal document',
    '• U.S. Citizen ID Card (Form I-197)',
    '• Identification Card for Use of Resident Citizen in the United States (Form I-179)',
    '• Employment authorization document issued by the Department of Homeland Security'
  ];
  
  listCDocs.forEach(doc_item => {
    doc.fontSize(8).font('Helvetica').text(doc_item, 300, y, { width: 240 });
    y += 10;
  });
  
  y = Math.max(y, 350) + 30;
  
  // Verification Section
  doc.fontSize(12).font('Helvetica-Bold').text('DOCUMENT VERIFICATION (To be completed by authorized personnel)', 50, y);
  y += 20;
  
  // Table for documents
  doc.fontSize(10).font('Helvetica');
  doc.text('Document Title:', 50, y);
  doc.text('Issuing Authority:', 200, y);
  doc.text('Document Number:', 350, y);
  doc.text('Expiration Date:', 450, y);
  
  y += 15;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 5;
  
  // Document 1
  doc.rect(50, y, 140, 20).stroke();
  doc.rect(200, y, 140, 20).stroke();
  doc.rect(350, y, 90, 20).stroke();
  doc.rect(450, y, 90, 20).stroke();
  
  y += 30;
  
  // Document 2 (if needed)
  doc.rect(50, y, 140, 20).stroke();
  doc.rect(200, y, 140, 20).stroke();
  doc.rect(350, y, 90, 20).stroke();
  doc.rect(450, y, 90, 20).stroke();
  
  y += 40;
  
  // Signature section
  doc.fontSize(10).font('Helvetica');
  doc.text('I attest, under penalty of perjury, that (1) I have examined the document(s) presented by the above-named employee,', 50, y);
  y += 12;
  doc.text('(2) the above-listed document(s) appear to be genuine and to relate to the employee named, and (3) to the best of', 50, y);
  y += 12;
  doc.text('my knowledge the employee is authorized to work in the United States.', 50, y);
  
  y += 30;
  
  doc.text('Signature of Employer or Authorized Representative:', 50, y);
  doc.moveTo(280, y + 10).lineTo(450, y + 10).stroke();
  
  y += 20;
  
  doc.text('Print Name:', 50, y);
  doc.moveTo(120, y + 10).lineTo(250, y + 10).stroke();
  
  doc.text('Title:', 270, y);
  doc.moveTo(300, y + 10).lineTo(450, y + 10).stroke();
  
  y += 20;
  
  doc.text('Business or Organization Name:', 50, y);
  doc.moveTo(200, y + 10).lineTo(400, y + 10).stroke();
  
  y += 20;
  
  doc.text('Date (mm/dd/yyyy):', 50, y);
  doc.moveTo(150, y + 10).lineTo(250, y + 10).stroke();
  
  y += 30;
  
  // Footer note
  doc.fontSize(8).font('Helvetica').text('This form must be retained by the employer and made available for inspection by federal government officials.', 50, y);
}

async function sendAdminNotificationWithPDF(data, pdfBuffer) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured');
  }

  // Create Gmail transporter
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'web@wareworks.me',
    to: process.env.ADMIN_EMAIL || 'admin@wareworks.me',
    subject: `New Application: ${data.legalFirstName} ${data.legalLastName} - ${data.positionApplied || 'General Position'}`,
    text: `
New application received for WareWorks.

Applicant: ${data.legalFirstName} ${data.legalLastName}
Position: ${data.positionApplied || 'Not specified'}
Phone: ${data.phoneNumber}
Email: ${data.email || 'Not provided'}
Submission ID: ${data.submissionId}
Submitted: ${moment(data.serverTimestamp).format('MMMM DD, YYYY at h:mm A')}
Language: ${data.language === 'es' ? 'Spanish' : 'English'}

Please review the attached application package and complete the I-9 verification process.

Next steps:
1. Review the application
2. Have the employee sign the I-9 form manually  
3. Verify identification documents
4. Complete Section 2 of the I-9 form
5. Store completed forms according to company policy

IP Address: ${data.ipAddress}
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #2c5aa0;">New Application Received</h2>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #2c5aa0;">Applicant Information:</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Name:</strong> ${data.legalFirstName} ${data.legalLastName}</li>
      <li><strong>Position:</strong> ${data.positionApplied || 'Not specified'}</li>
      <li><strong>Phone:</strong> ${data.phoneNumber}</li>
      <li><strong>Email:</strong> ${data.email || 'Not provided'}</li>
      <li><strong>Submission ID:</strong> ${data.submissionId}</li>
      <li><strong>Language:</strong> ${data.language === 'es' ? 'Spanish' : 'English'}</li>
      <li><strong>Submitted:</strong> ${moment(data.serverTimestamp).format('MMMM DD, YYYY at h:mm A')}</li>
    </ul>
  </div>
  
  <p>Please review the attached application package and complete the I-9 verification process.</p>
  
  <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h4 style="margin-top: 0; color: #1976d2;">Next Steps:</h4>
    <ol>
      <li>Review the application</li>
      <li>Have the employee sign the I-9 form manually</li>
      <li>Verify identification documents</li>
      <li>Complete Section 2 of the I-9 form</li>
      <li>Store completed forms according to company policy</li>
    </ol>
  </div>
  
  <p><small>IP Address: ${data.ipAddress}</small></p>
</div>
    `
  };

  // Add PDF attachment if available
  if (pdfBuffer) {
    mailOptions.attachments = [{
      filename: `WareWorks-Application-${data.legalFirstName}-${data.legalLastName}-${data.submissionId}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }];
  }

  await transporter.sendMail(mailOptions);
}