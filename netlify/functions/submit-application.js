// netlify/functions/submit-application.js
// WareWorks Form Submission Handler - Enhanced Version 4.0
// Handles secure form submission with enhanced validation, file processing, and notifications

const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const { PDFDocument: PDFLib, rgb } = require('pdf-lib');
const { getStore } = require('@netlify/blobs');
const moment = require('moment');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Max-Age': '86400',
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
        'Work Authorization', 'Full-time Employment', 'Swing Shifts', 'Graveyard Shifts',
        'Sunday Availability', 'Monday Availability', 'Tuesday Availability', 
        'Wednesday Availability', 'Thursday Availability', 'Friday Availability', 'Saturday Availability',
        'Position Applied', 'Expected Salary', 'Job Discovery',
        'Previously Applied', 'Previous Application Details', 'Education History',
        'Employment History', 'Has ID Document', 'Has Resume', 'Certification Count',
        'ID Document URL', 'Resume URL', 'Certification URLs',
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
        certCount: data.documents.certifications ? data.documents.certifications.length : 0,
        idBlobUrl: data.documents.identification?.blobUrl || '',
        resumeBlobUrl: data.documents.resume?.blobUrl || '',
        certificationBlobUrls: data.documents.certifications ? 
            data.documents.certifications.map(cert => cert.blobUrl).join('; ') : ''
    } : { hasId: false, hasResume: false, certCount: 0, idBlobUrl: '', resumeBlobUrl: '', certificationBlobUrls: '' };

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
        data.fullTimeEmployment || '',
        data.swingShifts || '',
        data.graveyardShifts || '',
        data.availabilitySunday || '',
        data.availabilityMonday || '',
        data.availabilityTuesday || '',
        data.availabilityWednesday || '',
        data.availabilityThursday || '',
        data.availabilityFriday || '',
        data.availabilitySaturday || '',
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
        docInfo.idBlobUrl,
        docInfo.resumeBlobUrl,
        docInfo.certificationBlobUrls,
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
 * Generate comprehensive PDF application package using templates
 */
async function generateApplicationPDF(data) {
    try {
        console.log('Starting PDF generation with templates...');
        
        // Create a new PDF document
        const pdfDoc = await PDFLib.create();
        
        // Load and populate template files
        const populatedApplicationDoc = await loadAndPopulateApplicationTemplate(data);
        const populatedI9Doc = await loadAndPopulateI9Template(data);
        
        // Add populated application template pages
        console.log('Adding populated application template pages...');
        const appPages = await pdfDoc.copyPages(populatedApplicationDoc, populatedApplicationDoc.getPageIndices());
        appPages.forEach((page) => pdfDoc.addPage(page));
        
        // Add populated I-9 template pages
        console.log('Adding populated I-9 template pages...');
        const i9Pages = await pdfDoc.copyPages(populatedI9Doc, populatedI9Doc.getPageIndices());
        i9Pages.forEach((page) => pdfDoc.addPage(page));
        
        // Add uploaded documents
        if (data.documents) {
            await addUploadedDocumentsToPDF(pdfDoc, data.documents);
        }
        
        // Add a summary page with submission info
        await addSubmissionSummaryPage(pdfDoc, data);
        
        // Generate final PDF buffer
        const pdfBytes = await pdfDoc.save();
        console.log('PDF generation completed successfully');
        
        return Buffer.from(pdfBytes);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    }
}

/**
 * Load PDF template from templates folder
 */
async function loadTemplate(filename) {
    try {
        const templatePath = path.join(__dirname, '../../Templates', filename);
        console.log('Loading template:', templatePath);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${filename}`);
        }
        
        const templateBytes = fs.readFileSync(templatePath);
        const templateDoc = await PDFLib.load(templateBytes);
        
        console.log(`Template loaded: ${filename} (${templateDoc.getPageCount()} pages)`);
        return templateDoc;
        
    } catch (error) {
        console.error(`Error loading template ${filename}:`, error);
        throw error;
    }
}

/**
 * Load and populate WareWorks Application template with form data
 */
async function loadAndPopulateApplicationTemplate(data) {
    try {
        console.log('Loading and populating WareWorks Application template...');
        
        const templateDoc = await loadTemplate('Wareworks Application.pdf');
        const form = templateDoc.getForm();
        
        // Helper function to format Yes/No answers with visual indicators
        const formatYesNo = (value) => {
            if (!value) return '';
            const isYes = value.toLowerCase() === 'yes';
            return isYes ? '☑ YES ☐ No' : '☐ Yes ☑ NO';
        };

        // Map form data to PDF fields
        const fieldMappings = {
            'Legal First Name': data.legalFirstName,
            'Legal Last Name': data.legalLastName,
            'Street Address': data.streetAddress,
            'City': data.city,
            'State': data.state,
            'Zip Code': data.zipCode,
            'Home Phone': data.homePhone || data.phoneNumber,
            'Cell Phone Number': data.cellPhone || data.phoneNumber,
            'Social Security Number': data.socialSecurityNumber,
            'Email': data.email,
            'Position Applied For': data.positionApplied,
            'Expected Salary': data.expectedSalary,
            'How did you discover this job opening': data.jobDiscovery,
            'Have you previously applied at WareWorks  Yes  No': formatYesNo(data.previouslyApplied),
            'If yes please specify when and where': data.previousApplicationWhen,
            
            // Emergency contact
            'Name': data.emergencyName,
            'Number': data.emergencyPhone,
            'Relationship': data.emergencyRelationship,
            
            // Work availability (if we have this data)
            'Sunday': data.availabilitySunday || '',
            'Monday': data.availabilityMonday || '',
            'Tuesday': data.availabilityTuesday || '',
            'Wednesday': data.availabilityWednesday || '',
            'Thursday': data.availabilityThursday || '',
            'Friday': data.availabilityFriday || '',
            'Saturday': data.availabilitySaturday || '',
            
            // Yes/No Questions - using undefined fields as fallback
            'undefined': formatYesNo(data.age18), // Age 18+ question
            'undefined_2': formatYesNo(data.transportation), // Transportation question  
            'undefined_7': formatYesNo(data.workAuthorization), // Work authorization question
            'undefined_3': formatYesNo(data.fullTimeEmployment), // Full-time employment question
            'undefined_4': formatYesNo(data.swingShifts), // Swing shifts question
            'undefined_5': formatYesNo(data.graveyardShifts) // Graveyard shifts question
        };
        
        // Populate education fields
        if (data.education && Array.isArray(data.education)) {
            if (data.education[0]) {
                fieldMappings['School Name and Location'] = data.education[0].schoolName || '';
                fieldMappings['Year'] = data.education[0].graduationYear || '';
                fieldMappings['Major'] = data.education[0].fieldOfStudy || '';
            }
            if (data.education[1]) {
                fieldMappings['School Name and Location_2'] = data.education[1].schoolName || '';
                fieldMappings['Year_2'] = data.education[1].graduationYear || '';
                fieldMappings['Major_2'] = data.education[1].fieldOfStudy || '';
            }
        }
        
        // Populate employment fields
        if (data.employment && Array.isArray(data.employment)) {
            if (data.employment[0]) {
                fieldMappings['Company Name and Location'] = data.employment[0].companyName || '';
                fieldMappings['Starting Position'] = data.employment[0].startingPosition || '';
                fieldMappings['Ending Position'] = data.employment[0].endingPosition || '';
                fieldMappings['Supervisor Name'] = data.employment[0].supervisorName || '';
                fieldMappings['Telephone Number'] = data.employment[0].supervisorPhone || '';
                fieldMappings['Responsibilities 1'] = data.employment[0].responsibilities || '';
                fieldMappings['Reason for Leaving 1'] = data.employment[0].reasonForLeaving || '';
            }
            if (data.employment[1]) {
                fieldMappings['Company Name and Location_2'] = data.employment[1].companyName || '';
                fieldMappings['Starting Position_2'] = data.employment[1].startingPosition || '';
                fieldMappings['Ending Position_2'] = data.employment[1].endingPosition || '';
                fieldMappings['Supervisor Name_2'] = data.employment[1].supervisorName || '';
                fieldMappings['Telephone Number_2'] = data.employment[1].supervisorPhone || '';
                fieldMappings['Responsibilities 1_2'] = data.employment[1].responsibilities || '';
                fieldMappings['Reason for Leaving 1_2'] = data.employment[1].reasonForLeaving || '';
            }
        }
        
        // Apply field mappings
        let fieldsPopulated = 0;
        for (const [fieldName, value] of Object.entries(fieldMappings)) {
            if (value) {
                try {
                    const field = form.getField(fieldName);
                    if (field && field.constructor.name === 'PDFTextField') {
                        field.setText(String(value));
                        fieldsPopulated++;
                    }
                } catch (error) {
                    console.warn(`Could not populate field "${fieldName}":`, error.message);
                }
            }
        }
        
        console.log(`WareWorks Application: Populated ${fieldsPopulated} fields`);
        return templateDoc;
        
    } catch (error) {
        console.error('Error populating WareWorks Application template:', error);
        throw error;
    }
}

/**
 * Load and populate I-9 template with form data
 */
async function loadAndPopulateI9Template(data) {
    try {
        console.log('Loading and populating I-9 template...');
        
        const templateDoc = await loadTemplate('i-9.pdf');
        const form = templateDoc.getForm();
        
        // Format data for I-9 form
        const today = moment().format('MM/DD/YYYY');
        const dobFormatted = data.dateOfBirth ? moment(data.dateOfBirth).format('MM/DD/YYYY') : '';
        const ssnNumbers = data.socialSecurityNumber ? data.socialSecurityNumber.replace(/\D/g, '') : '';
        
        // Map form data to I-9 PDF fields
        const fieldMappings = {
            // Employee Section 1
            'Last Name (Family Name)': data.legalLastName,
            'First Name Given Name': data.legalFirstName,
            'Employee Middle Initial (if any)': data.middleInitial,
            'Employee Other Last Names Used (if any)': data.otherLastNames,
            'Address Street Number and Name': data.streetAddress,
            'Apt Number (if any)': data.aptNumber,
            'City or Town': data.city,
            'State': data.state,
            'ZIP Code': data.zipCode,
            'Date of Birth mmddyyyy': dobFormatted,
            'US Social Security Number': ssnNumbers,
            'Employees E-mail Address': data.email,
            'Telephone Number': data.phoneNumber,
            "Today's Date mmddyyy": today,
            
            // Section 2 fields (some will be filled by employer)
            'Last Name Family Name from Section 1': data.legalLastName,
            'First Name Given Name from Section 1': data.legalFirstName,
            'Middle initial if any from Section 1': data.middleInitial,
            'Last Name Family Name from Section 1-2': data.legalLastName,
            'First Name Given Name from Section 1-2': data.legalFirstName,
            'Middle initial if any from Section 1-2': data.middleInitial,
            
            // Today's date in various fields
            'S2 Todays Date mmddyyyy': today,
            'Todays Date 0': today,
            'Todays Date 1': today,
            'Todays Date 2': today
        };
        
        // Apply field mappings
        let fieldsPopulated = 0;
        for (const [fieldName, value] of Object.entries(fieldMappings)) {
            if (value) {
                try {
                    const field = form.getField(fieldName);
                    if (field) {
                        if (field.constructor.name === 'PDFTextField') {
                            field.setText(String(value));
                            fieldsPopulated++;
                        } else if (field.constructor.name === 'PDFDropdown') {
                            field.select(String(value));
                            fieldsPopulated++;
                        }
                    }
                } catch (error) {
                    console.warn(`Could not populate I-9 field "${fieldName}":`, error.message);
                }
            }
        }
        
        console.log(`I-9 Form: Populated ${fieldsPopulated} fields`);
        return templateDoc;
        
    } catch (error) {
        console.error('Error populating I-9 template:', error);
        throw error;
    }
}

/**
 * Add uploaded documents to PDF
 */
async function addUploadedDocumentsToPDF(pdfDoc, documents) {
    try {
        console.log('Adding uploaded documents to PDF...');
        const store = getStore('wareworks-documents');
        
        // Add identification document
        if (documents.identification?.blobUrl) {
            await addDocumentFromBlob(pdfDoc, store, documents.identification, 'ID Document');
        }
        
        // Add resume
        if (documents.resume?.blobUrl) {
            await addDocumentFromBlob(pdfDoc, store, documents.resume, 'Resume');
        }
        
        // Add certifications
        if (documents.certifications && documents.certifications.length > 0) {
            for (let i = 0; i < documents.certifications.length; i++) {
                const cert = documents.certifications[i];
                await addDocumentFromBlob(pdfDoc, store, cert, `Certification ${i + 1}`);
            }
        }
        
        console.log('All uploaded documents added to PDF');
        
    } catch (error) {
        console.error('Error adding uploaded documents:', error);
        // Don't throw - continue with PDF generation even if some documents fail
    }
}

/**
 * Add a single document from Netlify Blob to PDF
 */
async function addDocumentFromBlob(pdfDoc, store, documentInfo, documentLabel) {
    try {
        console.log(`Adding ${documentLabel}: ${documentInfo.originalName}`);
        
        // Extract document ID from blob URL
        const documentId = documentInfo.blobUrl.split('/').pop();
        
        // Get document from Netlify Blobs
        const { data: documentBuffer } = await store.get(documentId, { type: 'arrayBuffer' });
        
        if (!documentBuffer) {
            console.warn(`Document not found in blob storage: ${documentId}`);
            return;
        }
        
        // Add separator page
        const separatorPage = pdfDoc.addPage();
        const { width, height } = separatorPage.getSize();
        
        separatorPage.drawText(documentLabel, {
            x: 50,
            y: height - 100,
            size: 20,
            color: rgb(0.075, 0.122, 0.357) // WareWorks blue
        });
        
        separatorPage.drawText(`Original filename: ${documentInfo.originalName}`, {
            x: 50,
            y: height - 130,
            size: 12,
            color: rgb(0.4, 0.4, 0.4)
        });
        
        // Handle different document types
        if (documentInfo.mimeType === 'application/pdf') {
            // Merge PDF pages
            const uploadedDoc = await PDFLib.load(documentBuffer);
            const pages = await pdfDoc.copyPages(uploadedDoc, uploadedDoc.getPageIndices());
            pages.forEach((page) => pdfDoc.addPage(page));
            
        } else if (documentInfo.mimeType.startsWith('image/')) {
            // Embed image
            let image;
            if (documentInfo.mimeType === 'image/png') {
                image = await pdfDoc.embedPng(documentBuffer);
            } else {
                image = await pdfDoc.embedJpg(documentBuffer);
            }
            
            const imagePage = pdfDoc.addPage();
            const imagePageSize = imagePage.getSize();
            
            // Scale image to fit page while maintaining aspect ratio
            const imageWidth = image.width;
            const imageHeight = image.height;
            const maxWidth = imagePageSize.width - 100;
            const maxHeight = imagePageSize.height - 100;
            
            let scaledWidth = imageWidth;
            let scaledHeight = imageHeight;
            
            if (imageWidth > maxWidth) {
                scaledWidth = maxWidth;
                scaledHeight = (imageHeight * maxWidth) / imageWidth;
            }
            
            if (scaledHeight > maxHeight) {
                scaledHeight = maxHeight;
                scaledWidth = (imageWidth * maxHeight) / imageHeight;
            }
            
            imagePage.drawImage(image, {
                x: (imagePageSize.width - scaledWidth) / 2,
                y: (imagePageSize.height - scaledHeight) / 2,
                width: scaledWidth,
                height: scaledHeight,
            });
        }
        
        console.log(`Successfully added ${documentLabel} to PDF`);
        
    } catch (error) {
        console.error(`Error adding document ${documentLabel}:`, error);
        // Don't throw - continue with other documents
    }
}

/**
 * Add submission summary page
 */
async function addSubmissionSummaryPage(pdfDoc, data) {
    try {
        const summaryPage = pdfDoc.addPage();
        const { width, height } = summaryPage.getSize();
        
        let y = height - 100;
        
        // Title
        summaryPage.drawText('Application Submission Summary', {
            x: 50,
            y: y,
            size: 20,
            color: rgb(0.075, 0.122, 0.357)
        });
        
        y -= 40;
        
        // Submission details
        const details = [
            `Submission ID: ${data.submissionId}`,
            `Submitted: ${moment(data.serverTimestamp).format('MMMM DD, YYYY at h:mm A')}`,
            `Applicant: ${data.legalFirstName} ${data.legalLastName}`,
            `Position: ${data.positionApplied || 'Not specified'}`,
            `Phone: ${data.phoneNumber}`,
            `Email: ${data.email || 'Not provided'}`,
            `Language: ${data.language === 'es' ? 'Spanish' : 'English'}`
        ];
        
        details.forEach(detail => {
            summaryPage.drawText(detail, {
                x: 50,
                y: y,
                size: 12,
                color: rgb(0.2, 0.2, 0.2)
            });
            y -= 20;
        });
        
        y -= 20;
        
        // Documents submitted
        summaryPage.drawText('Documents Included:', {
            x: 50,
            y: y,
            size: 14,
            color: rgb(0.075, 0.122, 0.357)
        });
        
        y -= 25;
        
        const docList = [];
        if (data.documents?.identification) docList.push('✓ Government-issued ID');
        if (data.documents?.resume) docList.push('✓ Resume/CV');
        if (data.documents?.certifications?.length > 0) {
            docList.push(`✓ ${data.documents.certifications.length} Certification(s)`);
        }
        
        if (docList.length === 0) {
            docList.push('⚠ No documents uploaded');
        }
        
        docList.forEach(doc => {
            summaryPage.drawText(doc, {
                x: 70,
                y: y,
                size: 10,
                color: rgb(0.3, 0.3, 0.3)
            });
            y -= 15;
        });
        
        console.log('Added submission summary page');
        
    } catch (error) {
        console.error('Error adding summary page:', error);
        // Don't throw - summary page is optional
    }
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