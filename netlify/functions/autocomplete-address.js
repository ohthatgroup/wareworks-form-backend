// netlify/functions/autocomplete-address.js
// Enhanced Google Places Autocomplete API Proxy - Version 4.0
// Secure server-side proxy with caching, rate limiting, and enhanced security

const crypto = require('crypto');

// Configuration and security constants
const SECURITY_CONFIG = {
    // Rate limiting configuration
    RATE_LIMIT: {
        window: 60000, // 1 minute
        max: 60 // 60 requests per minute per IP
    },
    
    // Allowed domains for CORS
    ALLOWED_DOMAINS: [
        'wareworks.me',
        'www.wareworks.me',
        'wareworks.webflow.io',
        'wareworks-backend.netlify.app',
        'localhost',
        '127.0.0.1'
    ],
    
    // Cache configuration
    CACHE: {
        enabled: true,
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        maxSize: 1000 // Maximum cached items
    },
    
    // Input validation
    INPUT_VALIDATION: {
        minLength: 3,
        maxLength: 200,
        allowedChars: /^[a-zA-Z0-9\s\-.,#]+$/
    }
};

// In-memory stores (in production, use Redis or similar)
const rateLimitStore = new Map();
const cacheStore = new Map();

/**
 * Main handler function for address autocomplete
 */
exports.handler = async (event, context) => {
    const startTime = Date.now();
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
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
            return createErrorResponse(405, 'Method Not Allowed', headers);
        }

        // Rate limiting check
        const rateLimitResult = checkRateLimit(event);
        if (!rateLimitResult.allowed) {
            logSecurityEvent('autocomplete_rate_limit_exceeded', {
                ip: getClientIP(event),
                userAgent: event.headers['user-agent']
            });
            return createErrorResponse(429, 'Too Many Requests', headers);
        }

        // Security validation
        const securityResult = validateSecurity(event);
        if (!securityResult.valid) {
            logSecurityEvent('autocomplete_access_denied', {
                reason: securityResult.reason,
                ip: getClientIP(event),
                referer: event.headers.referer
            });
            return createErrorResponse(403, 'Access Denied', headers);
        }

        // Input validation
        const inputValidation = validateInput(event.queryStringParameters);
        if (!inputValidation.valid) {
            return createErrorResponse(400, inputValidation.error, headers);
        }

        const { input } = inputValidation;

        // Check cache first
        const cacheKey = generateCacheKey(input);
        const cachedResult = getCachedResult(cacheKey);
        if (cachedResult) {
            logAutocompleteRequest(event, input, 'cache_hit', Date.now() - startTime);
            return {
                statusCode: 200,
                headers: {
                    ...headers,
                    'X-Cache': 'HIT',
                    'Cache-Control': 'public, max-age=3600'
                },
                body: JSON.stringify(cachedResult)
            };
        }

        // Validate API key availability
        if (!process.env.GOOGLE_MAPS_API_KEY) {
            console.error('Google Maps API Key not configured');
            return createErrorResponse(500, 'Address autocomplete service temporarily unavailable', headers);
        }

        // Make request to Google Places API
        const googleResponse = await fetchGooglePlacesData(input);
        
        // Process and filter response
        const processedResponse = processGoogleResponse(googleResponse);
        
        // Cache the result
        setCachedResult(cacheKey, processedResponse);
        
        // Log successful request
        logAutocompleteRequest(event, input, 'api_hit', Date.now() - startTime);

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'X-Cache': 'MISS',
                'Cache-Control': 'public, max-age=3600'
            },
            body: JSON.stringify(processedResponse)
        };

    } catch (error) {
        console.error('Autocomplete function error:', error);
        logAutocompleteError(error, event);
        
        return createErrorResponse(500, 'Internal server error', headers);
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
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= SECURITY_CONFIG.RATE_LIMIT.max) {
        return { allowed: false };
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
        /curl/i,
        /wget/i,
        /python-requests/i,
        /bot/i,
        /crawler/i,
        /spider/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        return { 
            valid: false, 
            reason: 'suspicious_user_agent',
            userAgent 
        };
    }

    // If no referer, allow but log (could be direct API access or mobile app)
    if (!referer && !origin) {
        logSecurityEvent('direct_autocomplete_access', { 
            userAgent, 
            ip: getClientIP(event) 
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
 * Validate input parameters
 */
function validateInput(queryParams) {
    if (!queryParams || !queryParams.input) {
        return { 
            valid: false, 
            error: 'Missing required parameter: input' 
        };
    }

    const input = queryParams.input.trim();

    // Length validation
    if (input.length < SECURITY_CONFIG.INPUT_VALIDATION.minLength) {
        return { 
            valid: false, 
            error: `Input too short. Minimum ${SECURITY_CONFIG.INPUT_VALIDATION.minLength} characters required.` 
        };
    }

    if (input.length > SECURITY_CONFIG.INPUT_VALIDATION.maxLength) {
        return { 
            valid: false, 
            error: `Input too long. Maximum ${SECURITY_CONFIG.INPUT_VALIDATION.maxLength} characters allowed.` 
        };
    }

    // Character validation
    if (!SECURITY_CONFIG.INPUT_VALIDATION.allowedChars.test(input)) {
        return { 
            valid: false, 
            error: 'Input contains invalid characters. Only letters, numbers, spaces, and basic punctuation allowed.' 
        };
    }

    // SQL injection basic protection
    const sqlPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+set/i,
        /exec\s*\(/i,
        /script/i,
        /<script/i
    ];

    if (sqlPatterns.some(pattern => pattern.test(input))) {
        return { 
            valid: false, 
            error: 'Input contains potentially malicious content.' 
        };
    }

    return { valid: true, input };
}

/**
 * Generate cache key for input
 */
function generateCacheKey(input) {
    // Normalize input for consistent caching
    const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');
    return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Get cached result
 */
function getCachedResult(cacheKey) {
    if (!SECURITY_CONFIG.CACHE.enabled) {
        return null;
    }

    const cached = cacheStore.get(cacheKey);
    if (!cached) {
        return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > SECURITY_CONFIG.CACHE.ttl) {
        cacheStore.delete(cacheKey);
        return null;
    }

    return cached.data;
}

/**
 * Set cached result
 */
function setCachedResult(cacheKey, data) {
    if (!SECURITY_CONFIG.CACHE.enabled) {
        return;
    }

    // Clean cache if too large
    if (cacheStore.size >= SECURITY_CONFIG.CACHE.maxSize) {
        // Remove oldest entries (simple LRU)
        const oldestKey = cacheStore.keys().next().value;
        cacheStore.delete(oldestKey);
    }

    cacheStore.set(cacheKey, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Fetch data from Google Places API
 */
async function fetchGooglePlacesData(input) {
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    
    // Build query parameters
    const params = new URLSearchParams({
        input: input,
        types: 'address',
        components: 'country:us', // Restrict to US addresses
        key: process.env.GOOGLE_MAPS_API_KEY
    });

    const url = `${baseUrl}?${params.toString()}`;

    // Set timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'WareWorks-Form-Backend/4.0',
                'Accept': 'application/json'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Google Places API responded with status ${response.status}`);
        }

        const data = await response.json();

        // Check for API errors
        if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }

        return data;

    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Google Places API request timed out');
        }
        
        throw error;
    }
}

/**
 * Process and filter Google response
 */
function processGoogleResponse(googleData) {
    const predictions = googleData.predictions || [];
    
    // Filter and map predictions to our format
    const processedPredictions = predictions
        .slice(0, 5) // Limit to 5 results
        .map(prediction => ({
            description: prediction.description,
            place_id: prediction.place_id,
            structured_formatting: {
                main_text: prediction.structured_formatting?.main_text || '',
                secondary_text: prediction.structured_formatting?.secondary_text || ''
            },
            types: prediction.types || []
        }))
        .filter(prediction => {
            // Filter out non-address results
            const addressTypes = ['street_address', 'route', 'street_number', 'premise'];
            return prediction.types.some(type => 
                addressTypes.includes(type) || 
                prediction.description.match(/^\d+\s/)
            );
        });

    return {
        predictions: processedPredictions,
        status: googleData.status || 'OK',
        attribution: 'Powered by Google Places API',
        timestamp: new Date().toISOString()
    };
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
            error: true,
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            predictions: [] // Return empty predictions for frontend compatibility
        })
    };
}

/**
 * Log autocomplete request
 */
function logAutocompleteRequest(event, input, cacheStatus, responseTime) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: 'autocomplete_request',
        input: input.substring(0, 50), // Truncate for privacy
        inputLength: input.length,
        cacheStatus,
        responseTimeMs: responseTime,
        ip: getClientIP(event),
        userAgent: event.headers['user-agent'],
        referer: event.headers.referer
    };

    console.log('AUTOCOMPLETE_REQUEST:', JSON.stringify(logData));
}

/**
 * Log security events
 */
function logSecurityEvent(eventType, details) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: eventType,
        severity: 'warning',
        service: 'autocomplete',
        ...details
    };

    console.warn('AUTOCOMPLETE_SECURITY:', JSON.stringify(logData));
}

/**
 * Log autocomplete errors
 */
function logAutocompleteError(error, event) {
    const logData = {
        timestamp: new Date().toISOString(),
        event: 'autocomplete_error',
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
            queryParams: event.queryStringParameters
        }
    };

    console.error('AUTOCOMPLETE_ERROR:', JSON.stringify(logData));
}

/**
 * Health check endpoint (if query parameter health=check)
 */
function handleHealthCheck() {
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: 'healthy',
            service: 'autocomplete-address',
            version: '4.0',
            timestamp: new Date().toISOString(),
            cache: {
                enabled: SECURITY_CONFIG.CACHE.enabled,
                size: cacheStore.size,
                maxSize: SECURITY_CONFIG.CACHE.maxSize
            },
            rateLimit: {
                activeIPs: rateLimitStore.size
            }
        })
    };
}

// Export health check for monitoring
exports.healthCheck = handleHealthCheck;