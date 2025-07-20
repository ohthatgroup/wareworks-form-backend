// netlify/functions/upload-documents.js
// WareWorks Document Upload Handler with Netlify Blobs
// Handles secure file uploads to Netlify Blobs storage

const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

// Configuration constants
const SECURITY_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
    MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB total
    ALLOWED_DOMAINS: [
        'wareworks.me',
        'www.wareworks.me',
        'wareworks.webflow.io',
        'wareworks-backend.netlify.app',
        'localhost',
        '127.0.0.1',
        'localhost:3000',
        'localhost:8080',
        'localhost:3001',
        'file://',
        'webflow.io',
        'preview.webflow.com'
    ],
    RATE_LIMIT: {
        window: 60000, // 1 minute
        max: 10 // 10 uploads per minute per IP
    }
};

// In-memory rate limiting store
const rateLimitStore = new Map();

/**
 * Main handler function for document upload
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
            logSecurityEvent('upload_rate_limit_exceeded', {
                ip: getClientIP(event),
                userAgent: event.headers['user-agent']
            });
            return createErrorResponse(429, 'Too Many Requests', headers);
        }

        // Security validation - allow more permissive for file uploads
        const securityResult = validateSecurity(event);
        if (!securityResult.valid) {
            logSecurityEvent('upload_access_denied', {
                reason: securityResult.reason,
                ip: getClientIP(event),
                userAgent: event.headers['user-agent']
            });
            // For file uploads, be more lenient and just log
            console.warn('Security validation failed but allowing upload:', securityResult);
        }

        // Parse and validate request body
        const requestData = await parseRequestBody(event);
        if (!requestData.success) {
            return createErrorResponse(400, requestData.error, headers);
        }

        const data = requestData.data;

        // Validate documents
        const validation = validateDocuments(data.documents);
        if (!validation.isValid) {
            return createErrorResponse(400, `Document validation failed: ${validation.errors.join(', ')}`, headers);
        }

        // Upload documents to Netlify Blobs
        const uploadResults = await uploadDocumentsToBlobs(data.documents, data.submissionId);

        // Log successful upload
        logSuccessfulUpload(data, uploadResults, Date.now() - startTime);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                submissionId: data.submissionId,
                uploadedFiles: uploadResults,
                message: 'Documents uploaded successfully'
            })
        };

    } catch (error) {
        console.error('Document upload error:', error);
        logUploadError(error, event);
        
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

        if (!data.documents || typeof data.documents !== 'object') {
            return { success: false, error: 'Documents are required' };
        }

        if (!data.submissionId) {
            return { success: false, error: 'Submission ID is required' };
        }

        return { success: true, data };

    } catch (error) {
        return { success: false, error: 'Invalid JSON format' };
    }
}

/**
 * Check rate limiting for uploads
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
 * Validate security constraints (more permissive for uploads)
 */
function validateSecurity(event) {
    const referer = event.headers.referer || '';
    const origin = event.headers.origin || '';
    const userAgent = event.headers['user-agent'] || '';
    
    // For development/testing, be more lenient
    if (!referer && !origin) {
        return { valid: true, reason: 'no_referer_but_allowed' };
    }

    // Check allowed domains if referer/origin exists
    if (referer || origin) {
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
    
    // Validate certifications (optional)
    if (documents.certifications && Array.isArray(documents.certifications) && documents.certifications.length > 0) {
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
 * Upload documents to Netlify Blobs
 */
async function uploadDocumentsToBlobs(documents, submissionId) {
    const store = getStore('wareworks-documents');
    const uploadResults = {
        identification: null,
        resume: null,
        certifications: []
    };

    try {
        // Upload identification document
        if (documents.identification) {
            const idResult = await uploadSingleDocument(store, documents.identification, 'identification', submissionId, 0);
            uploadResults.identification = idResult;
        }

        // Upload resume (optional)
        if (documents.resume) {
            const resumeResult = await uploadSingleDocument(store, documents.resume, 'resume', submissionId, 0);
            uploadResults.resume = resumeResult;
        }

        // Upload certifications
        if (documents.certifications && Array.isArray(documents.certifications)) {
            for (let i = 0; i < documents.certifications.length; i++) {
                const certResult = await uploadSingleDocument(store, documents.certifications[i], 'certifications', submissionId, i);
                uploadResults.certifications.push(certResult);
            }
        }

        return uploadResults;

    } catch (error) {
        console.error('Blob upload error:', error);
        throw new Error(`Failed to upload documents: ${error.message}`);
    }
}

/**
 * Upload single document to Netlify Blobs
 */
async function uploadSingleDocument(store, document, type, submissionId, index) {
    const documentId = generateDocumentId(submissionId, type, index);
    const buffer = Buffer.from(document.data, 'base64');
    
    // Store the file in Netlify Blobs
    await store.set(documentId, buffer, {
        metadata: {
            originalName: document.name,
            mimeType: document.type,
            size: document.size,
            uploadedAt: new Date().toISOString(),
            submissionId: submissionId,
            documentType: type
        }
    });

    // Generate the blob URL
    const blobUrl = `https://wareworks-backend.netlify.app/.netlify/blobs/wareworks-documents/${documentId}`;

    return {
        documentId: documentId,
        originalName: document.name,
        mimeType: document.type,
        size: document.size,
        blobUrl: blobUrl,
        uploadedAt: new Date().toISOString(),
        documentType: type
    };
}

/**
 * Generate unique document ID
 */
function generateDocumentId(submissionId, type, index) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(2).toString('hex');
    const ext = getFileExtension(type);
    return `${submissionId}_${type}_${index}_${timestamp}_${random}${ext}`;
}

/**
 * Get file extension based on document type
 */
function getFileExtension(type) {
    const extensions = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };
    return extensions[type] || '';
}

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

/**
 * Log successful upload
 */
function logSuccessfulUpload(data, uploadResults, processingTime) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: 'successful_document_upload',
        submissionId: data.submissionId,
        uploadedFiles: {
            identification: !!uploadResults.identification,
            resume: !!uploadResults.resume,
            certificationCount: uploadResults.certifications.length
        },
        processingTimeMs: processingTime,
        ipAddress: getClientIP(event)
    };

    console.log('SUCCESSFUL_UPLOAD:', JSON.stringify(logData));
}

/**
 * Log security events
 */
function logSecurityEvent(eventType, details) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: eventType,
        severity: 'warning',
        service: 'upload-documents',
        ...details
    };

    console.warn('UPLOAD_SECURITY:', JSON.stringify(logData));
}

/**
 * Log upload errors
 */
function logUploadError(error, event) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: 'upload_error',
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

    console.error('UPLOAD_ERROR:', JSON.stringify(logData));
}