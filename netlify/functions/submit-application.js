// netlify/functions/submit-application.js
// WareWorks Form Submission Handler - Enhanced Version 4.0
// Handles secure form submission with enhanced validation, file processing, and notifications

const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const crypto = require('crypto');

// Configuration and security constants
const SECURITY_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
    MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB total
    ALLOWED_DOMAINS: [
        'wareworks.me',
        'www.wareworks.me',
        'wareworks.webflow.io',
        'wareworks-backend.netlify.app',
        'localhost',
        '127.0.0.1'
    ],
    RATE_LIMIT: {
        window: 60000, // 1 minute
        max: 5 // 5 submissions per minute per IP
    }
};

// In-memory rate limiting store
const rateLimitStore = new Map();

/**
 * Main handler function for form submission
 */
exports.handler = async (event, context) => {
    const startTime = Date.now();
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    try {
        // Handle preflight requests
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        // Only allow POST requests
        if (event.httpMethod !== 'POST') {
            return createErrorResponse(405, 'Method Not Allowed', headers);
        }

        // Rate limiting check
        const rateLimitResult = checkRateLimit(event);
        if (!rateLimitResult.allowed) {
            logSecurityEvent('rate_limit_exceeded', {
                ip: getClientIP(event),
                userAgent: event.headers['user-agent']
            });
            return createErrorResponse(429, 'Too Many Requests', headers);
        }

        // Security validation
        const securityResult = validateSecurity(event);
        if (!securityResult.valid) {
            logSecurityEvent('submission_blocked', {
                reason: securityResult.reason,
                ip: getClientIP(event),
                userAgent: event.headers['user-agent']
            });
            return createErrorResponse(403, 'Access Denied', headers);
        }

        // Parse and validate request body
        const requestData = await parseRequestBody(event);
        if (!requestData.success) {
            return createErrorResponse(400, requestData.error, headers);
        }

        const data = requestData.data;

        // Add server-side metadata
        enrichSubmissionData(data, event);

        // Comprehensive validation
        const validation = await validateSubmission(data);
        if (!validation.isValid) {
            logValidationFailure(data.submissionId, validation.errors);
            return createErrorResponse(400, `Validation failed: ${validation.errors.join(', ')}`, headers);
        }

        // Process the submission
        const results = await processSubmission(data);

        // Log successful submission
        logSuccessfulSubmission(data, results, Date.now() - startTime);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                submissionId: data.submissionId,
                timestamp: data.serverTimestamp,
                message: 'Application submitted successfully',
                processingResults: results.summary,
                nextSteps: {
                    confirmationSent: results.results.adminNotification?.success || false,
                    expectedResponse: '5-7 business days',
                    contactInfo: process.env.HR_EMAIL || 'hr@wareworks.me'
                }
            })
        };

    } catch (error) {
        console.error('Form submission error:', error);
        logSubmissionError(error, event);
        
        return createErrorResponse(500, 'Internal server error occurred. Please try again.', headers);
    }
};

/**
 * Parse and validate request body
 */
async function parseRequestBody(event) {
    try {
        if (!event.body) {
            return { success: false, error: 'Request body is required' };
        }

        // Check content length
        const contentLength = parseInt(event.headers['content-length'] || '0');
        if (contentLength > SECURITY_CONFIG.MAX_TOTAL_SIZE) {
            return { success: false, error: 'Request too large' };
        }

        const data = JSON.parse(event.body);
        
        // Basic structure validation
        if (!data || typeof data !== 'object') {
            return { success: false, error: 'Invalid request format' };
        }

        return { success: true, data };

    } catch (error) {
        return { success: false, error: 'Invalid JSON format' };
    }
}

/**
 * Check rate limiting for submissions
 */
function checkRateLimit(event) {
    const clientIP = getClientIP(event);
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT.window;
    
    // Clean old entries
    for (const [ip, requests] of rateLimitStore.entries()) {
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        if (validRequests.length === 0) {
            rateLimitStore.delete(ip);
        } else {
            rateLimitStore.set(ip, validRequests);
        }
    }
    
    // Check current IP
    if (!rateLimitStore.has(clientIP)) {
        rateLimitStore.set(clientIP, []);
    }
    
    const requests = rateLimitStore.get(clientIP);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= SECURITY_CONFIG.RATE_LIMIT.max) {
        return { allowed: false };
    }
    
    validRequests.push(now);
    rateLimitStore.set(clientIP, validRequests);
    
    return { allowed: true };
}

/**
 * Validate security constraints
 */
function validateSecurity(event) {
    const referer = event.headers.referer || '';
    const origin = event.headers.origin || '';
    const userAgent = event.headers['user-agent'] || '';
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /curl/i,
        /wget/i,
        /python/i,
        /postman/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        return { valid: false, reason: 'suspicious_user_agent' };
    }

    // Validate origin if provided
    if (origin || referer) {
        const isAllowed = SECURITY_CONFIG.ALLOWED_DOMAINS.some(domain => 
            (referer && referer.includes(domain)) || 
            (origin && origin.includes(domain))
        );
        
        if (!isAllowed) {
            return { valid: false, reason: 'invalid_origin' };
        }
    }

    return { valid: true };
}

/**
 * Enrich submission data with server-side metadata
 */
function enrichSubmissionData(data, event) {
    data.serverTimestamp = new Date().toISOString();
    data.submissionId = generateSubmissionId();
    data.serverValidated = true;
    data.ipAddress = getClientIP(event);
    data.userAgent = event.headers['user-agent'] || 'unknown';
    data.referer = event.headers.referer || 'direct';
    data.processingStartTime = Date.now();
    
    // Add security fingerprint
    data.securityFingerprint = generateSecurityFingerprint(event);
}

/**
 * Generate unique submission ID
 */
function generateSubmissionId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `WW_${timestamp}_${random}`;
}

/**
 * Generate security fingerprint for tracking
 */
function generateSecurityFingerprint(event) {
    const components = [
        getClientIP(event),
        event.headers['user-agent'] || '',
        event.headers['accept-language'] || '',
        event.headers['accept-encoding'] || ''
    ];
    
    return crypto
        .createHash('sha256')
        .update(components.join('|'))
        .digest('hex')
        .substring(0, 16);
}

/**
 * Comprehensive validation of submission data
 */
async function validateSubmission(data) {
    const errors = [];
    
    // Required personal information
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
        if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    
    // Validate email format if provided
    if (data.email && data.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            errors.push('Invalid email format');
        }
    }
    
    // Validate SSN format
    if (data.socialSecurityNumber && !/^\d{3}-\d{2}-\d{4}$/.test(data.socialSecurityNumber)) {
        errors.push('Invalid Social Security Number format');
    }
    
    // Validate phone number format
    if (data.phoneNumber && !/^\(\d{3}\) \d{3}-\d{4}$/.test(data.phoneNumber)) {
        errors.push('Invalid phone number format');
    }
    
    // Validate ZIP code
    if (data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
        errors.push('Invalid ZIP code format');
    }
    
    // Document validation
    const documentValidation = validateDocuments(data.documents);
    if (!documentValidation.isValid) {
        errors.push(...documentValidation.errors);
    }
    
    // Validate education entries
    if (data.education && Array.isArray(data.education)) {
        data.education.forEach((entry, index) => {
            if (entry && Object.keys(entry).length > 0) {
                if (!entry.schoolName || entry.schoolName.trim() === '') {
                    errors.push(`Education entry ${index + 1}: School name is required`);
                }
            }
        });
    }
    
    // Validate employment entries
    if (data.employment && Array.isArray(data.employment)) {
        data.employment.forEach((entry, index) => {
            if (entry && Object.keys(entry).length > 0) {
                if (!entry.companyName || entry.companyName.trim() === '') {
                    errors.push(`Employment entry ${index + 1}: Company name is required`);
                }
            }
        });
    }
    
    // Validate submission size
    const dataSize = JSON.stringify(data).length;
    if (dataSize > SECURITY_CONFIG.MAX_TOTAL_SIZE) {
        errors.push('Submission data too large');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate uploaded documents
 */
function validateDocuments(documents) {
    const errors = [];
    
    if (!documents || typeof documents !== 'object') {
        errors.push('Documents section is required');
        return { isValid: false, errors };
    }
    
    // Validate identification document (required)
    if (!documents.identification) {
        errors.push('Government-issued photo ID is required');
    } else {
        const idValidation = validateDocument(documents.identification, 'identification');
        if (!idValidation.isValid) {
            errors.push(`ID document: ${idValidation.error}`);
        }
    }
    
    // Validate certifications (required, at least one)
    if (!documents.certifications || !Array.isArray(documents.certifications) || documents.certifications.length === 0) {
        errors.push('At least one certification document is required');
    } else {
        documents.certifications.forEach((cert, index) => {
            const certValidation = validateDocument(cert, 'certifications');
            if (!certValidation.isValid) {
                errors.push(`Certification ${index + 1}: ${certValidation.error}`);
            }
        });
    }
    
    // Validate resume (optional)
    if (documents.resume) {
        const resumeValidation = validateDocument(documents.resume, 'resume');
        if (!resumeValidation.isValid) {
            errors.push(`Resume: ${resumeValidation.error}`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate individual document
 */
function validateDocument(document, type) {
    if (!document || typeof document !== 'object') {
        return { isValid: false, error: 'Invalid document format' };
    }
    
    // Check required properties
    const requiredProps = ['name', 'size', 'type', 'data'];
    for (const prop of requiredProps) {
        if (!document[prop]) {
            return { isValid: false, error: `Missing ${prop}` };
        }
    }
    
    // Validate file size
    if (document.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
        return { isValid: false, error: 'File size exceeds 10MB limit' };
    }
    
    // Validate file type
    const allowedTypes = {
        identification: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        certifications: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    };
    
    if (!allowedTypes[type].includes(document.type)) {
        return { isValid: false, error: 'Invalid file type' };
    }
    
    // Validate base64 data
    try {
        const buffer = Buffer.from(document.data, 'base64');
        if (buffer.length !== document.size) {
            return { isValid: false, error: 'File size mismatch' };
        }
    } catch (error) {
        return { isValid: false, error: 'Invalid file data' };
    }
    
    return { isValid: true };
}

/**
 * Process the validated submission
 */
async function processSubmission(data) {
    const results = {
        submissionId: data.submissionId,
        timestamp: data.serverTimestamp,
        results: {},
        summary: {}
    };

    // Save to Google Sheets
    if (parseBoolean(process.env.ENABLE_GOOGLE_SHEETS)) {
        try {
            const sheetResult = await saveToGoogleSheets(data);
            results.results.googleSheets = sheetResult;
            results.summary.googleSheets = 'success';
        } catch (error) {
            console.error('Google Sheets save failed:', error);
            results.results.googleSheets = { success: false, error: error.message };
            results.summary.googleSheets = 'failed';
        }
    }

    // Process documents
    try {
        const documentResult = await processDocuments(data.documents, data.submissionId);
        results.results.documentProcessing = documentResult;
        results.summary.documentProcessing = 'success';
    } catch (error) {
        console.error('Document processing failed:', error);
        results.results.documentProcessing = { success: false, error: error.message };
        results.summary.documentProcessing = 'failed';
    }

    // Generate PDF application package
    let pdfBuffer = null;
    if (parseBoolean(process.env.ENABLE_PDF_GENERATION)) {
        try {
            pdfBuffer = await generateApplicationPDF(data);
            results.results.pdfGeneration = { success: true, size: pdfBuffer.length };
            results.summary.pdfGeneration = 'success';
        } catch (error) {
            console.error('PDF generation failed:', error);
            results.results.pdfGeneration = { success: false, error: error.message };
            results.summary.pdfGeneration = 'failed';
        }
    }

    // Send notifications
    if (parseBoolean(process.env.ENABLE_EMAIL_NOTIFICATIONS)) {
        try {
            await sendNotifications(data, pdfBuffer);
            results.results.adminNotification = { success: true };
            results.summary.emailNotifications = 'success';
        } catch (error) {
            console.error('Email notification failed:', error);
            results.results.adminNotification = { success: false, error: error.message };
            results.summary.emailNotifications = 'failed';
        }
    }

    return results;
}

/**
 * Save submission to Google Sheets
 */
async function saveToGoogleSheets(data) {
    try {
        // Google Sheets API setup with service account
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

        if (!spreadsheetId) {
            throw new Error('Google Sheets ID not configured');
        }

        const sheetName = 'WareWorks_Submissions_v4';
        
        // Ensure sheet exists
        await ensureSheetExists(sheets, spreadsheetId, sheetName);

        // Prepare row data
        const rowData = prepareSheetRowData(data);

        // Append the row
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:AZ`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [rowData]
            }
        });

        return { success: true, message: 'Data saved to Google Sheets', sheetName };

    } catch (error) {
        console.error('Google Sheets save error:', error);
        throw new Error(`Failed to save to Google Sheets: ${error.message}`);
    }
}

/**
 * Ensure the sheet exists with proper headers
 */
async function ensureSheetExists(sheets, spreadsheetId, sheetName) {
    try {
        // Check if sheet exists
        let headerCheck;
        try {
            headerCheck = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A1:AZ1`
            });
        } catch (error) {
            // Sheet doesn't exist, create it
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName
                            }
                        }
                    }]
                }
            });
            headerCheck = { data: { values: [] } };
        }

        // Add headers if they don't exist
        if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
            await createSheetHeaders(sheets, spreadsheetId, sheetName);
        }

    } catch (error) {
        throw new Error(`Failed to ensure sheet exists: ${error.message}`);
    }
}

/**
 * Create sheet headers
 */
async function createSheetHeaders(sheets, spreadsheetId, sheetName) {
    const headers = [
        'Submission ID', 'Timestamp', 'Language', 'Legal First Name', 'Middle Initial', 
        'Legal Last Name', 'Other Last Names', 'Street Address', 'Apt Number', 'City', 
        'State', 'ZIP Code', 'Phone Number', 'SSN Hash', 'Date of Birth', 'Email', 
        'Home Phone', 'Cell Phone', 'Emergency Name', 'Emergency Phone', 'Emergency Relationship',
        'Citizenship Status', 'USCIS A-Number', 'Work Auth Expiration', 'Alien Document Type',
        'Alien Document Number', 'Document Country', 'Age 18+', 'Transportation',
        'Work Authorization', 'Position Applied', 'Expected Salary', 'Job Discovery',
        'Previously Applied', 'Previous Application Details', 'Education History',
        'Employment History', 'Has ID Document', 'Has Resume', 'Certification Count',
        'IP Address', 'User Agent', 'Security Fingerprint', 'Processing Time'
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:AP1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [headers]
        }
    });

    // Format headers
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
    const sheetId = sheet?.properties?.sheetId || 0;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests: [{
                repeatCell: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 0,
                        endColumnIndex: headers.length
                    },
                    cell: {
                        userEnteredFormat: {
                            textFormat: { bold: true },
                            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                        }
                    },
                    fields: 'userEnteredFormat(textFormat,backgroundColor)'
                }
            }]
        }
    });
}

/**
 * Prepare data row for Google Sheets
 */
function prepareSheetRowData(data) {
    // Hash SSN for security
    const ssnHash = data.socialSecurityNumber ? 
        crypto.createHash('sha256').update(data.socialSecurityNumber).digest('hex').substring(0, 16) : '';

    const docInfo = data.documents ? {
        hasId: !!data.documents.identification,
        hasResume: !!data.documents.resume,
        certCount: data.documents.certifications ? data.documents.certifications.length : 0
    } : { hasId: false, hasResume: false, certCount: 0 };

    return [
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
        ssnHash,
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
        docInfo.hasId ? 'Yes' : 'No',
        docInfo.hasResume ? 'Yes' : 'No',
        docInfo.certCount.toString(),
        data.ipAddress || '',
        data.userAgent || '',
        data.securityFingerprint || '',
        Date.now() - data.processingStartTime
    ];
}

/**
 * Process documents (validate, log, prepare for storage)
 */
async function processDocuments(documents, submissionId) {
    if (!documents) {
        return { success: true, message: 'No documents to process' };
    }

    const processedDocs = {
        identification: null,
        resume: null,
        certifications: []
    };

    // Process each document type
    if (documents.identification) {
        processedDocs.identification = await processDocument(
            documents.identification, 
            'identification', 
            submissionId
        );
    }

    if (documents.resume) {
        processedDocs.resume = await processDocument(
            documents.resume, 
            'resume', 
            submissionId
        );
    }

    if (documents.certifications && Array.isArray(documents.certifications)) {
        for (let i = 0; i < documents.certifications.length; i++) {
            const processedCert = await processDocument(
                documents.certifications[i], 
                'certifications', 
                submissionId,
                i
            );
            processedDocs.certifications.push(processedCert);
        }
    }

    return {
        success: true,
        message: 'Documents processed successfully',
        documents: processedDocs
    };
}

/**
 * Process individual document
 */
async function processDocument(document, type, submissionId, index = 0) {
    const processedDoc = {
        originalName: document.name,
        size: document.size,
        type: document.type,
        uploadedAt: new Date().toISOString(),
        documentId: generateDocumentId(submissionId, type, index),
        processed: true
    };

    // In a full implementation, you would:
    // 1. Save to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // 2. Run virus scanning
    // 3. Generate thumbnails for images
    // 4. Extract text for searchability
    // 5. Apply watermarks
    
    // For now, we'll just log the processing
    console.log(`Document processed: ${processedDoc.documentId}`);

    return processedDoc;
}

/**
 * Generate unique document ID
 */
function generateDocumentId(submissionId, type, index) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(2).toString('hex');
    return `${submissionId}_${type}_${index}_${timestamp}_${random}`;
}

/**
 * Generate comprehensive PDF application package
 */
async function generateApplicationPDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Generate the complete application package
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

/**
 * Generate WareWorks application form PDF
 */
function generateWareWorksApplication(doc, data) {
    // Header
    doc.fontSize(18).font('Helvetica-Bold')
       .text('WAREWORKS APPLICATION FOR EMPLOYMENT', 50, 50);
    doc.fontSize(10).font('Helvetica')
       .text('Equal Opportunity Employer', 50, 75);
    
    let y = 100;
    
    // Personal Information Section
    doc.fontSize(14).font('Helvetica-Bold')
       .text('PERSONAL INFORMATION', 50, y);
    y += 25;
    
    doc.fontSize(10).font('Helvetica');
    
    // Name
    const fullName = `${data.legalFirstName || ''} ${data.middleInitial || ''} ${data.legalLastName || ''}`.trim();
    doc.text(`Name: ${fullName}`, 50, y);
    y += 15;
    
    // Address
    const address = `${data.streetAddress || ''} ${data.aptNumber || ''}`.trim();
    doc.text(`Address: ${address}`, 50, y);
    y += 15;
    
    const cityStateZip = `${data.city || ''}, ${data.state || ''} ${data.zipCode || ''}`.trim();
    doc.text(`City, State, ZIP: ${cityStateZip}`, 50, y);
    y += 15;
    
    // Contact
    doc.text(`Phone: ${data.phoneNumber || ''}`, 50, y);
    doc.text(`Email: ${data.email || 'Not provided'}`, 300, y);
    y += 15;
    
    // SSN (masked for security)
    const maskedSSN = data.socialSecurityNumber ? 
        '***-**-' + data.socialSecurityNumber.slice(-4) : 'Not provided';
    doc.text(`Social Security Number: ${maskedSSN}`, 50, y);
    doc.text(`Date of Birth: ${data.dateOfBirth || 'Not provided'}`, 300, y);
    y += 30;
    
    // Emergency Contact
    if (data.emergencyName) {
        doc.fontSize(12).font('Helvetica-Bold').text('EMERGENCY CONTACT', 50, y);
        y += 20;
        doc.fontSize(10).font('Helvetica');
        doc.text(`Name: ${data.emergencyName}`, 50, y);
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
    y += 20;
    
    // Add more sections as needed...
    
    // Footer
    y += 50;
    doc.fontSize(8).font('Helvetica');
    doc.text(`Submission ID: ${data.submissionId}`, 50, y);
    y += 12;
    doc.text(`Submitted: ${moment(data.serverTimestamp).format('MMMM DD, YYYY at h:mm A')}`, 50, y);
}

/**
 * Generate I-9 form (basic template)
 */
function generateI9Form(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold')
       .text('Employment Eligibility Verification', 50, 50);
    doc.fontSize(12).font('Helvetica')
       .text('Department of Homeland Security', 50, 70);
    doc.text('U.S. Citizenship and Immigration Services', 50, 85);
    doc.fontSize(10).text('USCIS Form I-9', 50, 100);
    
    // Employee information would be filled here
    // This is a template - actual I-9 forms require manual completion
    
    let y = 150;
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Section 1. Employee Information and Attestation', 50, y);
    y += 20;
    
    doc.fontSize(10).font('Helvetica')
       .text('(Employee must complete and sign Section 1 no later than the first day of employment)', 50, y);
    y += 30;
    
    // Add form fields...
    doc.text(`Last Name: ${data.legalLastName || ''}`, 50, y);
    doc.text(`First Name: ${data.legalFirstName || ''}`, 300, y);
    y += 20;
    
    doc.text(`Middle Initial: ${data.middleInitial || ''}`, 50, y);
    y += 20;
    
    doc.text(`Address: ${data.streetAddress || ''} ${data.aptNumber || ''}`, 50, y);
    y += 20;
    
    doc.text(`City: ${data.city || ''}`, 50, y);
    doc.text(`State: ${data.state || ''}`, 200, y);
    doc.text(`ZIP: ${data.zipCode || ''}`, 350, y);
    y += 30;
    
    doc.fontSize(8).font('Helvetica')
       .text('Note: This form must be completed manually by the employee and employer.', 50, y);
}

/**
 * Generate ID verification form
 */
function generateIDVerificationForm(doc, data) {
    doc.fontSize(16).font('Helvetica-Bold')
       .text('IDENTIFICATION DOCUMENT VERIFICATION', 50, 50);
    doc.fontSize(12).font('Helvetica')
       .text('For Administrative Use Only', 50, 75);
    
    let y = 110;
    
    doc.fontSize(12).font('Helvetica-Bold').text('EMPLOYEE INFORMATION', 50, y);
    y += 20;
    
    doc.fontSize(10).font('Helvetica');
    const fullName = `${data.legalFirstName || ''} ${data.legalLastName || ''}`.trim();
    doc.text(`Employee Name: ${fullName}`, 50, y);
    y += 15;
    doc.text(`Submission ID: ${data.submissionId}`, 50, y);
    y += 15;
    doc.text(`Date of Verification: _____________________`, 50, y);
    y += 30;
    
    // Document verification table
    doc.fontSize(12).font('Helvetica-Bold')
       .text('DOCUMENT VERIFICATION', 50, y);
    y += 20;
    
    doc.fontSize(10).font('Helvetica');
    doc.text('Document Title:', 50, y);
    doc.text('Issuing Authority:', 200, y);
    doc.text('Document Number:', 350, y);
    doc.text('Expiration Date:', 450, y);
    
    y += 20;
    // Create verification table
    doc.rect(50, y, 140, 20).stroke();
    doc.rect(200, y, 140, 20).stroke();
    doc.rect(350, y, 90, 20).stroke();
    doc.rect(450, y, 90, 20).stroke();
    
    y += 40;
    
    // Signature section
    doc.text('Signature of Employer or Authorized Representative:', 50, y);
    doc.moveTo(280, y + 10).lineTo(450, y + 10).stroke();
    
    y += 30;
    doc.text('Date:', 50, y);
    doc.moveTo(100, y + 10).lineTo(200, y + 10).stroke();
}

/**
 * Send email notifications
 */
async function sendNotifications(data, pdfBuffer) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error('Email credentials not configured');
    }

    // Create email transporter
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    // Prepare email content
    const mailOptions = {
        from: process.env.FROM_EMAIL || 'inbox@ohthatgrp.com',
        to: process.env.ADMIN_EMAIL || 'shimmy@ohthatgrp.com',
        cc: process.env.HR_EMAIL || 'hr@wareworks.me',
        subject: `New WareWorks Application: ${data.legalFirstName} ${data.legalLastName} - ${data.positionApplied || 'General Position'}`,
        text: generateEmailText(data),
        html: generateEmailHTML(data),
        attachments: pdfBuffer ? [{
            filename: `WareWorks-Application-${data.legalFirstName}-${data.legalLastName}-${data.submissionId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }] : []
    };

    // Send the email
    await transporter.sendMail(mailOptions);
}

/**
 * Generate email text content
 */
function generateEmailText(data) {
    return `
New WareWorks Application Received

Applicant Information:
- Name: ${data.legalFirstName} ${data.legalLastName}
- Position: ${data.positionApplied || 'Not specified'}
- Phone: ${data.phoneNumber}
- Email: ${data.email || 'Not provided'}
- Submission ID: ${data.submissionId}
- Submitted: ${moment(data.serverTimestamp).format('MMMM DD, YYYY at h:mm A')}
- Language: ${data.language === 'es' ? 'Spanish' : 'English'}

Documents Submitted:
- ID Document: ${data.documents?.identification ? 'Yes' : 'No'}
- Resume: ${data.documents?.resume ? 'Yes' : 'No'}
- Certifications: ${data.documents?.certifications ? data.documents.certifications.length + ' files' : 'None'}

Next Steps:
1. Review the application and documents
2. Have the employee sign the I-9 form manually
3. Verify identification documents
4. Complete Section 2 of the I-9 form
5. Store completed forms according to company policy

Technical Information:
- IP Address: ${data.ipAddress}
- Security Fingerprint: ${data.securityFingerprint}
`.trim();
}

/**
 * Generate email HTML content
 */
function generateEmailHTML(data) {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
    <div style="background: linear-gradient(135deg, #131f5b 0%, #1e308e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 24px;">New WareWorks Application</h2>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">Employment Application Received</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
        <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #131f5b;">Applicant Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td>${data.legalFirstName} ${data.legalLastName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Position:</td><td>${data.positionApplied || 'Not specified'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${data.phoneNumber}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${data.email || 'Not provided'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Language:</td><td>${data.language === 'es' ? 'Spanish' : 'English'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Submitted:</td><td>${moment(data.serverTimestamp).format('MMMM DD, YYYY at h:mm A')}</td></tr>
            </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="margin-top: 0; color: #131f5b;">Documents Submitted</h4>
            <ul style="list-style: none; padding: 0;">
                <li style="padding: 4px 0;">📄 ID Document: ${data.documents?.identification ? '✅ Provided' : '❌ Not provided'}</li>
                <li style="padding: 4px 0;">📋 Resume: ${data.documents?.resume ? '✅ Provided' : '❌ Not provided'}</li>
                <li style="padding: 4px 0;">🏆 Certifications: ${data.documents?.certifications ? '✅ ' + data.documents.certifications.length + ' files' : '❌ None provided'}</li>
            </ul>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #131f5b;">
            <h4 style="margin-top: 0; color: #131f5b;">Next Steps</h4>
            <ol style="margin: 0; padding-left: 20px;">
                <li>Review the application and submitted documents</li>
                <li>Have the employee sign the I-9 form manually</li>
                <li>Verify identification documents</li>
                <li>Complete Section 2 of the I-9 form</li>
                <li>Store completed forms according to company policy</li>
            </ol>
        </div>
        
        <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #666;">
            <strong>Submission ID:</strong> ${data.submissionId}<br>
            <strong>Security Fingerprint:</strong> ${data.securityFingerprint}
        </div>
    </div>
</div>
`.trim();
}

// Utility Functions

/**
 * Get client IP address
 */
function getClientIP(event) {
    return event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           event.headers['x-real-ip'] ||
           event.headers['cf-connecting-ip'] ||
           'unknown';
}

/**
 * Parse boolean environment variables
 */
function parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    return value.toString().toLowerCase() === 'true';
}

/**
 * Create standardized error response
 */
function createErrorResponse(statusCode, message, headers = {}) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({
            success: false,
            error: message,
            statusCode,
            timestamp: new Date().toISOString()
        })
    };
}

// Logging Functions

/**
 * Log successful submission
 */
function logSuccessfulSubmission(data, results, processingTime) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: 'successful_submission',
        submissionId: data.submissionId,
        applicantName: `${data.legalFirstName} ${data.legalLastName}`,
        position: data.positionApplied,
        language: data.language,
        processingTimeMs: processingTime,
        documentsSubmitted: {
            identification: !!data.documents?.identification,
            resume: !!data.documents?.resume,
            certificationCount: data.documents?.certifications?.length || 0
        },
        processingResults: results.summary,
        ipAddress: data.ipAddress,
        securityFingerprint: data.securityFingerprint
    };

    console.log('SUCCESSFUL_SUBMISSION:', JSON.stringify(logData));
}

/**
 * Log validation failure
 */
function logValidationFailure(submissionId, errors) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: 'validation_failure',
        submissionId,
        errors,
        severity: 'warning'
    };

    console.warn('VALIDATION_FAILURE:', JSON.stringify(logData));
}

/**
 * Log security events
 */
function logSecurityEvent(eventType, details) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: eventType,
        severity: 'warning',
        ...details
    };

    console.warn('SECURITY_EVENT:', JSON.stringify(logData));
}

/**
 * Log submission errors
 */
function logSubmissionError(error, event) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: 'submission_error',
        severity: 'error',
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        context: {
            ip: getClientIP(event),
            userAgent: event.headers['user-agent'],
            referer: event.headers.referer,
            method: event.httpMethod
        }
    };

    console.error('SUBMISSION_ERROR:', JSON.stringify(logData));
}