// netlify/functions/get-config.js
// WareWorks Form Configuration Endpoint - Enhanced Version 4.0
// Provides secure, validated configuration data to the frontend application

const crypto = require('crypto');

// Security configuration
const SECURITY_CONFIG = {
    // Allowed domains for CORS and referer checking
    ALLOWED_DOMAINS: [
        'wareworks.me',
        'www.wareworks.me',
        'wareworks.webflow.io',
        'wareworks-backend.netlify.app',
        'localhost',
        '127.0.0.1'
    ],
    // Rate limiting (requests per minute)
    RATE_LIMIT: {
        window: 60000, // 1 minute
        max: 30 // 30 requests per minute per IP
    },
    // Cache settings
    CACHE_TTL: 300 // 5 minutes
};

// In-memory rate limiting store (for basic protection)
const rateLimitStore = new Map();

/**
 * Main handler function for the configuration endpoint
 */
exports.handler = async (event, context) => {
    // Define CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': `public, max-age=${SECURITY_CONFIG.CACHE_TTL}`,
        'Content-Type': 'application/json'
    };

    try {
        // Handle preflight requests
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: ''
            };
        }

        // Only allow GET requests
        if (event.httpMethod !== 'GET') {
            return createErrorResponse(405, 'Method Not Allowed', corsHeaders);
        }

        // Rate limiting check
        const rateLimitResult = checkRateLimit(event);
        if (!rateLimitResult.allowed) {
            return createErrorResponse(429, 'Too Many Requests', corsHeaders, {
                retryAfter: Math.ceil(rateLimitResult.resetTime / 1000)
            });
        }

        // Security validation
        const securityResult = validateSecurity(event);
        if (!securityResult.valid) {
            logSecurityEvent('config_access_denied', {
                reason: securityResult.reason,
                ip: getClientIP(event),
                userAgent: event.headers['user-agent'],
                referer: event.headers.referer
            });
            return createErrorResponse(403, 'Access Denied', corsHeaders);
        }

        // Generate configuration
        const config = await generateConfiguration(event);
        
        // Log successful access
        logConfigAccess(event, config);

        return {
            statusCode: 200,
            headers: {
                ...corsHeaders,
                'X-Config-Version': config.version,
                'X-Generated-At': new Date().toISOString()
            },
            body: JSON.stringify(config)
        };

    } catch (error) {
        console.error('Configuration endpoint error:', error);
        
        // Log the error for monitoring
        logError('config_generation_error', error, event);
        
        return createErrorResponse(500, 'Internal Server Error', corsHeaders);
    }
};

/**
 * Check rate limiting for the requesting IP
 */
function checkRateLimit(event) {
    const clientIP = getClientIP(event);
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT.window;
    
    // Clean old entries
    cleanupRateLimit(windowStart);
    
    // Get or create entry for this IP
    if (!rateLimitStore.has(clientIP)) {
        rateLimitStore.set(clientIP, []);
    }
    
    const requests = rateLimitStore.get(clientIP);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= SECURITY_CONFIG.RATE_LIMIT.max) {
        return {
            allowed: false,
            resetTime: validRequests[0] + SECURITY_CONFIG.RATE_LIMIT.window
        };
    }
    
    // Add current request
    validRequests.push(now);
    rateLimitStore.set(clientIP, validRequests);
    
    return { allowed: true };
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimit(cutoff) {
    for (const [ip, requests] of rateLimitStore.entries()) {
        const validRequests = requests.filter(timestamp => timestamp > cutoff);
        if (validRequests.length === 0) {
            rateLimitStore.delete(ip);
        } else {
            rateLimitStore.set(ip, validRequests);
        }
    }
}

/**
 * Validate security constraints
 */
function validateSecurity(event) {
    const referer = event.headers.referer || '';
    const origin = event.headers.origin || '';
    const userAgent = event.headers['user-agent'] || '';
    
    // Check for suspicious user agents
    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i
    ];
    
    // Allow legitimate bots but log them
    const isBot = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    if (isBot) {
        logSecurityEvent('bot_access', { userAgent, referer, ip: getClientIP(event) });
    }

    // If no referer, allow but log (could be direct API access)
    if (!referer && !origin) {
        logSecurityEvent('direct_access', { 
            userAgent, 
            ip: getClientIP(event),
            headers: event.headers 
        });
        return { valid: true };
    }

    // Check allowed domains
    const isAllowedDomain = SECURITY_CONFIG.ALLOWED_DOMAINS.some(domain => {
        return (referer && referer.includes(domain)) || 
               (origin && origin.includes(domain));
    });

    if (!isAllowedDomain) {
        return { 
            valid: false, 
            reason: 'domain_not_allowed',
            referer,
            origin
        };
    }

    return { valid: true };
}

/**
 * Generate configuration object
 */
async function generateConfiguration(event) {
    // Get environment-specific settings
    const environment = process.env.NODE_ENV || 'production';
    const isDevelopment = environment === 'development';
    
    const config = {
        // Metadata
        version: "4.0.0",
        environment: environment,
        generatedAt: new Date().toISOString(),
        configId: generateConfigId(),
        
        // Main endpoints
        endpoints: {
            submit: process.env.NETLIFY_SUBMIT_URL || 'https://wareworks-backend.netlify.app/.netlify/functions/submit-application',
            autocomplete: 'https://wareworks-backend.netlify.app/.netlify/functions/autocomplete-address',
            config: 'https://wareworks-backend.netlify.app/.netlify/functions/get-config'
        },
        
        // Application limits
        limits: {
            maxEducationEntries: parseInt(process.env.MAX_EDUCATION_ENTRIES) || 5,
            maxEmploymentEntries: parseInt(process.env.MAX_EMPLOYMENT_ENTRIES) || 10,
            maxFileSize: 10485760, // 10MB in bytes
            maxTotalUploadSize: 52428800, // 50MB total
            sessionTimeout: (parseInt(process.env.DATA_RETENTION_HOURS) || 24) * 60 * 60 * 1000
        },
        
        // Feature flags
        features: {
            auditLogging: parseBoolean(process.env.ENABLE_AUDIT_LOGGING, true),
            debugMode: parseBoolean(process.env.ENABLE_DEBUG_MODE, false) && isDevelopment,
            emailNotifications: parseBoolean(process.env.ENABLE_EMAIL_NOTIFICATIONS, true),
            googleSheets: parseBoolean(process.env.ENABLE_GOOGLE_SHEETS, true),
            pdfGeneration: parseBoolean(process.env.ENABLE_PDF_GENERATION, true),
            addressAutocomplete: parseBoolean(process.env.ENABLE_ADDRESS_AUTOCOMPLETE, true),
            autoSave: parseBoolean(process.env.ENABLE_AUTO_SAVE, true),
            fileUpload: parseBoolean(process.env.ENABLE_FILE_UPLOAD, true),
            multilingual: parseBoolean(process.env.ENABLE_MULTILINGUAL, true)
        },
        
        // UI Configuration
        ui: {
            defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
            supportedLanguages: ['en', 'es'],
            theme: process.env.UI_THEME || 'wareworks',
            pageTransitions: parseBoolean(process.env.ENABLE_PAGE_TRANSITIONS, true),
            progressIndicator: parseBoolean(process.env.SHOW_PROGRESS_INDICATOR, true),
            stepValidation: parseBoolean(process.env.ENABLE_STEP_VALIDATION, true)
        },
        
        // File upload configuration
        fileUpload: {
            allowedTypes: {
                identification: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
                resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                certifications: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
            },
            maxFileSize: 10485760, // 10MB
            compressionEnabled: parseBoolean(process.env.ENABLE_FILE_COMPRESSION, true),
            virusScanning: parseBoolean(process.env.ENABLE_VIRUS_SCANNING, false)
        },
        
        // Security settings (public safe values only)
        security: {
            csrfProtection: parseBoolean(process.env.ENABLE_CSRF_PROTECTION, true),
            rateLimiting: {
                enabled: true,
                maxRequests: 30,
                windowMinutes: 1
            },
            sessionSecurity: {
                secureCookies: !isDevelopment,
                httpOnly: true,
                sameSite: 'strict'
            }
        },
        
        // Contact information
        contact: {
            adminEmail: process.env.ADMIN_EMAIL || 'admin@wareworks.me',
            supportEmail: process.env.SUPPORT_EMAIL || 'support@wareworks.me',
            hrEmail: process.env.HR_EMAIL || 'hr@wareworks.me'
        },
        
        // API versioning
        api: {
            version: 'v4',
            deprecationNotices: [],
            compatibilityMode: parseBoolean(process.env.API_COMPATIBILITY_MODE, false)
        }
    };

    // Remove sensitive information in production
    if (!isDevelopment) {
        // Remove debug-specific information
        delete config.features.debugMode;
        
        // Sanitize endpoints for security
        config.endpoints = sanitizeEndpoints(config.endpoints);
    }

    return config;
}

/**
 * Safely parse boolean environment variables
 */
function parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'boolean') return value;
    return value.toString().toLowerCase() === 'true';
}

/**
 * Sanitize endpoint URLs for security
 */
function sanitizeEndpoints(endpoints) {
    const sanitized = { ...endpoints };
    
    // Remove any potential sensitive query parameters
    Object.keys(sanitized).forEach(key => {
        const url = sanitized[key];
        if (url && typeof url === 'string') {
            try {
                const urlObj = new URL(url);
                // Remove any potentially sensitive query parameters
                urlObj.search = '';
                sanitized[key] = urlObj.toString();
            } catch (error) {
                // If URL parsing fails, keep original but log warning
                console.warn(`Invalid URL in config: ${key}=${url}`);
            }
        }
    });
    
    return sanitized;
}

/**
 * Generate a unique configuration ID for tracking
 */
function generateConfigId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `cfg_${timestamp}_${random}`;
}

/**
 * Get client IP address from event
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
function createErrorResponse(statusCode, message, headers = {}, additionalData = {}) {
    const response = {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({
            error: true,
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            ...additionalData
        })
    };

    // Add rate limit headers if applicable
    if (statusCode === 429 && additionalData.retryAfter) {
        response.headers['Retry-After'] = additionalData.retryAfter.toString();
        response.headers['X-RateLimit-Limit'] = SECURITY_CONFIG.RATE_LIMIT.max.toString();
        response.headers['X-RateLimit-Reset'] = additionalData.retryAfter.toString();
    }

    return response;
}

/**
 * Log configuration access for monitoring
 */
function logConfigAccess(event, config) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: 'config_accessed',
        ip: getClientIP(event),
        userAgent: event.headers['user-agent'],
        referer: event.headers.referer,
        configVersion: config.version,
        configId: config.configId,
        environment: config.environment
    };

    console.log('CONFIG_ACCESS:', JSON.stringify(logData));
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
 * Log errors with context
 */
function logError(errorType, error, event) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: errorType,
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
            method: event.httpMethod,
            path: event.path
        }
    };

    console.error('CONFIG_ERROR:', JSON.stringify(logData));
}