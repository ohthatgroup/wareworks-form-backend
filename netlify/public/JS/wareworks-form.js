// WareWorks Application Form - Enhanced JavaScript with File Upload
// Version 3.3 - Dynamic Page Loading, File Encoding, and Server-Side Google Maps Autocomplete

// Configuration URLs
const CONFIG = {
    NETLIFY_SUBMIT_URL: 'https://wareworks-backend.netlify.app/.netlify/functions/submit-application',
    NETLIFY_CONFIG_URL: 'https://wareworks-backend.netlify.app/.netlify/functions/get-config',
    TRANSLATION_SHEET_URL: 'https://docs.google.com/spreadsheets/d/1jgMtCCuntq8nA_zQTz8QWSnRd4YjevjXW2sPPQUwIy4/export?format=csv&gid=0',
    
    // Updated: URLs for your hosted HTML page fragments on Netlify
    PAGE_URLS: {
        1: 'https://wareworks-backend.netlify.app/form-pages/page1-personal-info.html',
        2: 'https://wareworks-backend.netlify.app/form-pages/page2-contact.html',
        3: 'https://wareworks-backend.netlify.app/form-pages/page3-citizenship.html',
        4: 'https://wareworks-backend.netlify.app/form-pages/page4-documents.html',
        5: 'https://wareworks-backend.netlify.app/form-pages/page5-application-questions.html',
        6: 'https://wareworks-backend.netlify.app/form-pages/page6-education-history.html',
        7: 'https://wareworks-backend.netlify.app/form-pages/page7-employment-history.html',
        8: 'https://wareworks-backend.netlify.app/form-pages/page8-review-submit.html'
    },

    // NEW: Endpoint for server-side Google Places Autocomplete
    AUTOCOMPLETE_API_URL: 'https://wareworks-backend.netlify.app/.netlify/functions/autocomplete-address',

    FALLBACK_CONFIG: {
        MAX_EDUCATION_ENTRIES: 5,
        MAX_EMPLOYMENT_ENTRIES: 10,
        DATA_RETENTION_HOURS: 24,
        ENABLE_AUDIT_LOGGING: true,
        ENABLE_DEBUG_MODE: false,
        ADMIN_EMAIL: 'shimmy@ohthatgrp.com',
        ENABLE_PDF_GENERATION: true,
        ENABLE_EMAIL_NOTIFICATIONS: true,
        ENABLE_GOOGLE_SHEETS: true,
        // GOOGLE_MAPS_API_KEY is no longer needed client-side, removed from fallback
    }
};

// Global state
let currentLanguage = 'en';
let translations = {};
let secureConfig = {};
let currentPage = 1;
let totalPages = 8; 
let educationCount = 1;
let employmentCount = 1;
// googleMapsLoaded and autocomplete are no longer directly relevant for client-side API loading
let uploadedDocuments = {
    identification: null,
    resume: null,
    certifications: []
};
// Store form data across pages
let formDataStore = {};

// Autocomplete debounce timer
let autocompleteTimer;

// Audit logging system
const auditLog = {
    sessionId: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    startTime: new Date().toISOString(),
    actions: [],
    
    log: function(action, details = {}) {
        this.actions.push({
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            userAgent: navigator.userAgent,
            sessionId: this.sessionId,
            language: currentLanguage,
            page: currentPage
        });
        
        if (secureConfig.ENABLE_DEBUG_MODE) {
            console.log('Audit:', action, details);
        }
    }
};

// Disclaimer popup functions
window.acceptDisclaimer = function(language) {
    currentLanguage = language;
    document.getElementById('languageDisclaimer').style.display = 'none';
    document.getElementById('mainFormContainer').style.display = 'block';
    
    // Update language selector
    document.querySelectorAll('.lang-button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === language);
    });
    
    // Apply translations
    applyTranslations(currentLanguage);
    
    auditLog.log('disclaimer_accepted', { language: language });
    
    // Load the first page content after disclaimer is accepted
    showPage(currentPage);
};

// Removed initializeGoogleMaps() as API key is now server-side

// Function to set up Google Maps Autocomplete on the street address field
function setupGoogleMapsAutocomplete() {
    const input = document.getElementById('streetAddress');
    if (input) {
        // Create a datalist for suggestions
        let dataList = document.getElementById('addressSuggestions');
        if (!dataList) {
            dataList = document.createElement('datalist');
            dataList.id = 'addressSuggestions';
            document.body.appendChild(dataList);
        }
        input.setAttribute('list', 'addressSuggestions');

        input.addEventListener('input', function() {
            clearTimeout(autocompleteTimer);
            const query = this.value;
            if (query.length < 3) { // Only search if input is at least 3 characters
                dataList.innerHTML = ''; // Clear suggestions if too short
                return;
            }
            autocompleteTimer = setTimeout(() => {
                fetchAddressSuggestions(query);
            }, 300); // Debounce for 300ms
        });

        // Optional: when a suggestion is selected, you might want to fill other fields.
        // This requires a Places Details API call, which would also be proxied server-side.
        // For simplicity, we'll just fill the main address input for now.
        input.addEventListener('change', function() {
            // If a datalist option was selected, its value is typically the full description.
            // If more detailed parsing is needed (city, state, zip), a Places Details API call
            // with the place_id from the suggestion would be required.
            auditLog.log('address_selected', { address: this.value });
        });
    } else {
        console.log('Street address input not found for Autocomplete setup.');
    }
}

async function fetchAddressSuggestions(query) {
    try {
        auditLog.log('autocomplete_request_sent', { query: query });
        const response = await fetch(`${CONFIG.AUTOCOMPLETE_API_URL}?input=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const dataList = document.getElementById('addressSuggestions');
        dataList.innerHTML = ''; // Clear previous suggestions

        if (data.predictions && data.predictions.length > 0) {
            data.predictions.forEach(prediction => {
                const option = document.createElement('option');
                option.value = prediction.description;
                // Store place_id if you later need to fetch full details
                option.dataset.placeId = prediction.place_id; 
                dataList.appendChild(option);
            });
            auditLog.log('autocomplete_suggestions_received', { count: data.predictions.length });
        } else {
            auditLog.log('autocomplete_no_suggestions');
        }
    } catch (error) {
        console.error('Error fetching address suggestions:', error);
        auditLog.log('autocomplete_fetch_error', { error: error.message });
        showMessage('Could not fetch address suggestions.', 'warning');
    }
}


// Fill address fields from Google Maps selection (simplified as full parsing is complex without Places Details API)
function fillAddressFields(place) {
    // With server-side autocomplete, we only get the 'description' back.
    // To get city, state, zip, etc., you'd need another server-side proxy
    // to call the Google Places Details API using the place_id.
    // For now, we assume user selects the full address from the dropdown.
    auditLog.log('address_autofilled', { address: place.description || place.name || 'N/A' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        showLoading(true);
        auditLog.log('app_initialization_started');
        
        // Load configuration and translations (non-blocking for config)
        await Promise.all([
            loadSecureConfiguration().catch(err => {
                console.warn('Secure config failed, using fallback:', err.message);
                secureConfig = { ...CONFIG.FALLBACK_CONFIG };
            }),
            loadTranslations().catch(err => {
                console.warn('Translation loading failed, using fallback:', err.message);
                createFallbackTranslations();
            })
        ]);
        
        // Setup language selector and main event listeners (these are on the main shell)
        setupLanguageSelector();
        setupMainEventListeners(); // New function for main shell event listeners
        
        auditLog.log('app_initialization_completed');
        
    } catch (error) {
        console.error('Initialization error:', error);
        auditLog.log('app_initialization_error', { error: error.message });
        
        if (!secureConfig || Object.keys(secureConfig).length === 0) {
            secureConfig = { ...CONFIG.FALLBACK_CONFIG };
        }
        if (!translations || Object.keys(translations).length === 0) {
            createFallbackTranslations();
        }
        
        setupLanguageSelector();
        setupMainEventListeners();
        
        showMessage('Application loaded with limited functionality. Some features may not work.', 'warning');
    } finally {
        showLoading(false);
    }
});

// Function to initialize form elements on a newly loaded page
function initializePageElements() {
    addInputFormatters();
    setupConditionalFields();
    setupRepeatableSections();
    setupFileUploads(); // Re-setup file uploads for new page
    setupGoogleMapsAutocomplete(); // Re-setup autocomplete for new page (specifically page 1)
    // Restore data to newly loaded fields
    restoreFormData(currentPage);
    auditLog.log('page_elements_initialized', { page: currentPage });
}

// Setup event listeners for elements present in the main shell
function setupMainEventListeners() {
    document.getElementById('prevButton').addEventListener('click', previousPage);
    document.getElementById('nextButton').addEventListener('click', nextPage);
    
    // General input change listener for validation and audit logging
    document.getElementById('applicationForm').addEventListener('input', function(e) {
        if (e.target.hasAttribute('required')) {
            validateField(e.target);
        }
        auditLog.log('field_changed', {
            fieldName: e.target.name || e.target.id,
            fieldType: e.target.type || e.target.tagName.toLowerCase(),
            page: currentPage
        });
    });
    
    document.getElementById('applicationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        return false;
    });
}

// File Upload Functions (now called on page load)
function setupFileUploads() {
    setupSingleFileUpload('idDocument', 'identification');
    setupSingleFileUpload('resumeDocument', 'resume');
    setupMultiFileUpload('certificationDocuments', 'certifications');
    
    auditLog.log('file_uploads_initialized_for_page', { page: currentPage });
}

function setupSingleFileUpload(inputId, documentType) {
    const input = document.getElementById(inputId);
    const uploadArea = input?.parentElement?.querySelector('.file-upload-area');
    const preview = document.getElementById(inputId + 'Preview');
    
    if (!input || !uploadArea || !preview) return;
    
    // Clear existing listeners to prevent duplicates by cloning
    const newFileInput = input.cloneNode(true);
    input.parentNode.replaceChild(newFileInput, input);
    newFileInput.addEventListener('change', function(e) {
        handleFileSelection(e.target.files, documentType, preview, false);
    });
    
    const newUploadArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
    // Re-attach onclick handler for the new cloned upload area
    newUploadArea.onclick = () => newFileInput.click();

    newUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        newUploadArea.classList.add('dragover');
    });
    
    newUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        newUploadArea.classList.remove('dragover');
    });
    
    newUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        newUploadArea.classList.remove('dragover');
        handleFileSelection(e.dataTransfer.files, documentType, preview, false);
    });

    // Update preview with existing files
    updateFilePreview(documentType, preview);
}

function setupMultiFileUpload(inputId, documentType) {
    const input = document.getElementById(inputId);
    const uploadArea = input?.parentElement?.querySelector('.file-upload-area');
    const preview = document.getElementById(inputId + 'Preview');
    
    if (!input || !uploadArea || !preview) return;
    
    // Clear existing listeners to prevent duplicates by cloning
    const newFileInput = input.cloneNode(true);
    input.parentNode.replaceChild(newFileInput, input);
    newFileInput.addEventListener('change', function(e) {
        handleFileSelection(e.target.files, documentType, preview, true);
    });
    
    const newUploadArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
    // Re-attach onclick handler for the new cloned upload area
    newUploadArea.onclick = () => newFileInput.click();

    newUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        newUploadArea.classList.add('dragover');
    });
    
    newUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        newUploadArea.classList.remove('dragover');
    });
    
    newUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        newUploadArea.classList.remove('dragover');
        handleFileSelection(e.dataTransfer.files, documentType, preview, true);
    });

    // Update preview with existing files
    updateFilePreview(documentType, preview);
}

function handleFileSelection(files, documentType, preview, isMultiple) {
    if (!files || files.length === 0) return;
    
    const validFiles = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateFile(file, documentType);
        
        if (validation.isValid) {
            validFiles.push(file);
        } else {
            errors.push(`${file.name}: ${validation.error}`);
        }
    }
    
    if (errors.length > 0) {
        showMessage('File validation errors: ' + errors.join(', '), 'error');
        return;
    }
    
    if (isMultiple) {
        uploadedDocuments[documentType] = [...uploadedDocuments[documentType], ...validFiles];
    } else {
        uploadedDocuments[documentType] = validFiles[0];
    }
    
    updateFilePreview(documentType, preview);
    auditLog.log('files_selected', { 
        documentType: documentType, 
        fileCount: validFiles.length,
        fileNames: validFiles.map(f => f.name)
    });
}

function validateFile(file, documentType) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
        return { isValid: false, error: 'File size exceeds 10MB limit' };
    }
    
    const allowedTypes = {
        identification: ['image/jpeg', 'image/png', 'application/pdf'],
        resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        certifications: ['image/jpeg', 'image/png', 'application/pdf']
    };
    
    if (!allowedTypes[documentType].includes(file.type)) {
        return { isValid: false, error: 'Invalid file type' };
    }
    
    return { isValid: true };
}

function updateFilePreview(documentType, preview) {
    preview.innerHTML = '';
    
    const documents = uploadedDocuments[documentType];
    if (!documents) return;
    
    const files = Array.isArray(documents) ? documents : [documents];
    
    files.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item [Utility] Display Flex [Utility] Align Items Center [Utility] Justify Content Space-Between [Utility] Padding All XS-Gap MD-Radius BG-Secondary [Utility] Border Width 1px Border-Secondary [Utility] Margin Bottom XXS-Gap md:Flex-Vertical md:Align-Items-Start md:Flex-Gap XXS-Gap';
        
        const icon = getFileIcon(file.type);
        const size = formatFileSize(file.size);
        
        previewItem.innerHTML = `
            <div class="file-preview-info [Utility] Display Flex [Utility] Align Items Center [Utility] Flex Expand">
                <div class="file-preview-icon [Utility] Margin Right XXS-Gap [Utility] Font Size L">${icon}</div>
                <div class="file-preview-details [Utility] Flex Expand">
                    <div class="file-preview-name Paragraph [Utility] Font Weight 500 Text-Primary [Utility] Margin Bottom XXS-Gap">${file.name}</div>
                    <div class="file-preview-size Text-Secondary [Utility] Font Size XXS">${size}</div>
                </div>
            </div>
            <button type="button" class="Button Secondary [Utility] Font Size XXS [Utility] Padding All XXS-Gap SM-Radius md:Align-Self-End" onclick="removeFile('${documentType}', ${index})">Remove</button>
        `;
        
        preview.appendChild(previewItem);
    });
}

function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    return '📎';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

window.removeFile = function(documentType, index) {
    if (Array.isArray(uploadedDocuments[documentType])) {
        uploadedDocuments[documentType].splice(index, 1);
    } else {
        uploadedDocuments[documentType] = null;
    }
    
    const preview = document.getElementById(documentType === 'identification' ? 'idDocumentPreview' : 
                                          documentType === 'resume' ? 'resumeDocumentPreview' : 
                                          'certificationDocumentsPreview');
    updateFilePreview(documentType, preview);
    
    auditLog.log('file_removed', { documentType: documentType, index: index });
};

// Load secure configuration from Netlify function
async function loadSecureConfiguration() {
    try {
        auditLog.log('config_load_started');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(CONFIG.NETLIFY_CONFIG_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            secureConfig = await response.json();
            auditLog.log('config_load_success', { source: 'netlify_function' });
            
            if (!secureConfig.SUBMIT_URL) {
                console.warn('Config missing SUBMIT_URL, using fallback');
                secureConfig.SUBMIT_URL = CONFIG.FALLBACK_CONFIG.NETLIFY_SUBMIT_URL; 
            }
            // GOOGLE_MAPS_API_KEY is no longer fetched here.
            // No need to check secureConfig.GOOGLE_MAPS_API_KEY here anymore.

        } else {
            throw new Error(`Config server responded with ${response.status}`);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Config request timed out, using fallback');
        } else {
            console.warn('Secure config load failed, using fallback:', error.message);
        }
        auditLog.log('config_load_fallback', { error: error.message });
        secureConfig = { ...CONFIG.FALLBACK_CONFIG };
    }
}

// Load translations from Google Sheets
async function loadTranslations() {
    try {
        auditLog.log('translations_load_started');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(CONFIG.TRANSLATION_SHEET_URL, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Translation sheet responded with ${response.status}`);
        }
        
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        translations = { en: {}, es: {} };
        
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVRow(lines[i]);
            if (row.length >= 3 && row[0]) {
                const fieldKey = row[0];
                translations.en[fieldKey] = row[1] || fieldKey;
                translations.es[fieldKey] = row[2] || row[1] || fieldKey;
            }
        }
        
        auditLog.log('translations_load_success', { 
            totalTranslations: Object.keys(translations.en).length 
        });
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Translation request timed out, using fallback');
        } else {
            console.error('Translation loading failed:', error);
        }
        auditLog.log('translations_load_error', { error: error.message });
        createFallbackTranslations();
    }
}

// Parse CSV row handling commas in quotes
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Apply translations to page elements
function applyTranslations(language) {
    if (!translations[language]) {
        console.warn(`No translations available for language: ${language}`);
        return;
    }
    
    const elementsToTranslate = document.querySelectorAll('[data-translate]');
    
    elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = translations[language][key];
        
        if (translation) {
            if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                element.value = translation;
            } else if (element.placeholder !== undefined) {
                if (element.placeholder && translations[language][element.placeholder]) {
                    element.placeholder = translations[language][element.placeholder];
                }
            } else {
                element.textContent = translation;
            }
        }
    });
    
    updatePageIndicator();
    auditLog.log('translations_applied', { language: language });
}

// Language selector setup
function setupLanguageSelector() {
    const langButtons = document.querySelectorAll('.lang-button');
    
    langButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const newLanguage = this.getAttribute('data-lang');
            
            if (newLanguage !== currentLanguage) {
                langButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                currentLanguage = newLanguage;
                applyTranslations(currentLanguage);
                
                auditLog.log('language_changed', { 
                    previousLanguage: currentLanguage === 'en' ? 'es' : 'en',
                    newLanguage: newLanguage 
                });
            }
        });
    });
}

// Input formatters (now called on page load)
function addInputFormatters() {
    const ssnInput = document.getElementById('socialSecurityNumber');
    if (ssnInput) {
        ssnInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.substring(0,3) + '-' + value.substring(3,5) + '-' + value.substring(5,9);
            } else if (value.length >= 3) {
                value = value.substring(0,3) + '-' + value.substring(3);
            }
            e.target.value = value;
        });
    }

    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.substring(0,3) + '-' + value.substring(3,6) + '-' + value.substring(6,10);
            } else if (value.length >= 3) {
                value = value.substring(0,3) + '-' + value.substring(3);
            }
            e.target.value = value;
        });
    });
}

// Setup conditional fields (now called on page load)
function setupConditionalFields() {
    document.querySelectorAll('input[name="citizenshipStatus"]').forEach(radio => {
        radio.addEventListener('change', handleCitizenshipChange);
    });

    document.querySelectorAll('input[name="previouslyApplied"]').forEach(radio => {
        radio.addEventListener('change', handlePreviousApplicationChange);
    });

    const alienDocSelect = document.getElementById('alienDocumentType');
    if (alienDocSelect) {
        alienDocSelect.addEventListener('change', handleAlienDocumentTypeChange);
    }

    // Trigger initial state for conditional fields if data is already present
    // This is important when navigating back to a page
    const citizenshipRadios = document.querySelectorAll('input[name="citizenshipStatus"]');
    if (citizenshipRadios.length > 0) {
        const checkedRadio = Array.from(citizenshipRadios).find(radio => radio.checked);
        if (checkedRadio) handleCitizenshipChange({ target: checkedRadio });
    }
    const previouslyAppliedRadios = document.querySelectorAll('input[name="previouslyApplied"]');
    if (previouslyAppliedRadios.length > 0) {
        const checkedRadio = Array.from(previouslyAppliedRadios).find(radio => radio.checked);
        if (checkedRadio) handlePreviousApplicationChange({ target: checkedRadio });
    }
    if (alienDocSelect && alienDocSelect.value) {
        handleAlienDocumentTypeChange({ target: alienDocSelect });
    }
}

function handleCitizenshipChange(e) {
    const value = e.target.value;
    
    const lawfulFields = document.getElementById('lawfulPermanentFields');
    const alienFields = document.getElementById('alienAuthorizedFields');
    
    if (lawfulFields) lawfulFields.style.display = 'none';
    if (alienFields) alienFields.style.display = 'none';
    
    if (value === 'lawful_permanent' && lawfulFields) {
        lawfulFields.style.display = 'block';
    } else if (value === 'alien_authorized' && alienFields) {
        alienFields.style.display = 'block';
    }
    
    auditLog.log('citizenship_status_changed', { status: value });
}

function handlePreviousApplicationChange(e) {
    const details = document.getElementById('previousApplicationDetails');
    if (details) {
        details.style.display = e.target.value === 'yes' ? 'block' : 'none';
    }
    
    auditLog.log('previous_application_changed', { value: e.target.value });
}

function handleAlienDocumentTypeChange(e) {
    const details = document.getElementById('alienDocumentDetails');
    const countryField = document.getElementById('countryField');
    
    if (e.target.value && details) {
        details.style.display = 'block';
        if (countryField) {
            countryField.style.display = e.target.value === 'foreign_passport' ? 'block' : 'none';
        }
    } else if (details) {
        details.style.display = 'none';
    }
    
    auditLog.log('alien_document_type_changed', { documentType: e.target.value });
}

// Setup repeatable sections (now called on page load)
function setupRepeatableSections() {
    const addEducationBtn = document.getElementById('addEducationBtn');
    const addEmploymentBtn = document.getElementById('addEmploymentBtn');
    
    if (addEducationBtn) {
        addEducationBtn.addEventListener('click', addEducationEntry);
    }
    
    if (addEmploymentBtn) {
        addEmploymentBtn.addEventListener('click', addEmploymentEntry);
    }

    // Re-attach remove listeners for existing entries (if any were pre-filled)
    document.querySelectorAll('.education-entry .remove-entry-button').forEach(button => {
        button.addEventListener('click', () => window.removeEducationEntry(button));
    });
    document.querySelectorAll('.employment-entry .remove-entry-button').forEach(button => {
        button.addEventListener('click', () => window.removeEmploymentEntry(button));
    });
}

function addEducationEntry() {
    const maxEntries = secureConfig.MAX_EDUCATION_ENTRIES || 5;
    
    if (educationCount >= maxEntries) {
        showMessage(`Maximum ${maxEntries} education entries allowed.`, 'warning');
        return;
    }

    const container = document.getElementById('educationContainer');
    const newEntryDiv = document.createElement('div');
    newEntryDiv.className = 'education-entry repeatable-section BG-Secondary LG-Radius [Utility] Border Width 2px Border-Secondary [Utility] Padding All MD-Gap [Utility] Margin All MD-Gap [Utility] Position Relative';
    newEntryDiv.setAttribute('data-index', educationCount);
    
    newEntryDiv.innerHTML = `
        <div class="form-row Grid-Layout Desktop-2-Column [Utility] Flex Gap MD-Gap Tablet-1-Column Mobile-L-1-Column Mobile-P-1-Column">
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="schoolName_${educationCount}" class="Input-Label" data-translate="school_name">School Name and Location</label>
                <input type="text" class="Input" maxlength="256" name="education[${educationCount}][schoolName]" data-name="School Name" id="schoolName_${educationCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-schoolName_${educationCount}"></div>
            </div>
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="graduationYear_${educationCount}" class="Input-Label" data-translate="graduation_year">Year</label>
                <input type="text" class="Input" maxlength="4" name="education[${educationCount}][year]" data-name="Graduation Year" placeholder="YYYY" id="graduationYear_${educationCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-graduationYear_${educationCount}"></div>
            </div>
        </div>
        <div class="form-row Grid-Layout Desktop-2-Column [Utility] Flex Gap MD-Gap Tablet-1-Column Mobile-L-1-Column Mobile-P-1-Column">
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="major_${educationCount}" class="Input-Label" data-translate="major_field">Major/Field of Study</label>
                <input type="text" class="Input" maxlength="256" name="education[${educationCount}][major]" data-name="Major" id="major_${educationCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-major_${educationCount}"></div>
            </div>
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label class="Input-Label" data-translate="diploma_degree">Diploma/Degree?</label>
                <div class="radio-button-group [Utility] Flex Horizontal [Utility] Flex Gap MD-Gap [Utility] Margin Top XXS-Gap">
                    <label class="radio-button-field Radio-Toggle">
                        <input type="radio" id="diploma_${educationCount}_yes" name="education[${educationCount}][diploma]" value="yes" data-name="Diploma">
                        <span class="radio-button-label Input-Label" for="diploma_${educationCount}_yes" data-translate="yes">Yes</span>
                    </label>
                    <label class="radio-button-field Radio-Toggle">
                        <input type="radio" id="diploma_${educationCount}_no" name="education[${educationCount}][diploma]" value="no" data-name="Diploma">
                        <span class="radio-button-label Input-Label" for="diploma_${educationCount}_no" data-translate="no">No</span>
                    </label>
                </div>
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-diploma_${educationCount}"></div>
            </div>
        </div>
        <button type="button" class="Button Secondary [Utility] Margin Top MD-Gap remove-entry-button" data-translate="remove_entry" onclick="removeEducationEntry(this)">Remove Entry</button>
    `;
    
    container.appendChild(newEntryDiv);
    educationCount++;
    applyTranslations(currentLanguage); // Apply translations to new elements
    auditLog.log('education_entry_added', { entryNumber: educationCount - 1 });
}

function addEmploymentEntry() {
    const maxEntries = secureConfig.MAX_EMPLOYMENT_ENTRIES || 10;
    
    if (employmentCount >= maxEntries) {
        showMessage(`Maximum ${maxEntries} employment entries allowed.`, 'warning');
        return;
    }

    const container = document.getElementById('employmentContainer');
    const newEntryDiv = document.createElement('div');
    newEntryDiv.className = 'employment-entry repeatable-section BG-Secondary LG-Radius [Utility] Border Width 2px Border-Secondary [Utility] Padding All MD-Gap [Utility] Margin All MD-Gap [Utility] Position Relative';
    newEntryDiv.setAttribute('data-index', employmentCount);
    
    newEntryDiv.innerHTML = `
        <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
            <label for="companyName_${employmentCount}" class="Input-Label" data-translate="company_name">Company Name and Location</label>
            <input type="text" class="Input" maxlength="256" name="employment[${employmentCount}][companyName]" data-name="Company Name" id="companyName_${employmentCount}">
            <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-companyName_${employmentCount}"></div>
        </div>
        <div class="form-row Grid-Layout Desktop-2-Column [Utility] Flex Gap MD-Gap Tablet-1-Column Mobile-L-1-Column Mobile-P-1-Column">
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="startDate_${employmentCount}" class="Input-Label" data-translate="date_started">Date Started (MM/DD/YYYY)</label>
                <input type="date" class="Input" name="employment[${employmentCount}][startDate]" data-name="Start Date" id="startDate_${employmentCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-startDate_${employmentCount}"></div>
            </div>
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="endDate_${employmentCount}" class="Input-Label" data-translate="date_ended">Date Ended (MM/DD/YYYY)</label>
                <input type="date" class="Input" name="employment[${employmentCount}][endDate]" data-name="End Date" id="endDate_${employmentCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-endDate_${employmentCount}"></div>
            </div>
        </div>
        <div class="form-row Grid-Layout Desktop-2-Column [Utility] Flex Gap MD-Gap Tablet-1-Column Mobile-L-1-Column Mobile-P-1-Column">
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="startingPosition_${employmentCount}" class="Input-Label" data-translate="starting_position">Starting Position</label>
                <input type="text" class="Input" maxlength="256" name="employment[${employmentCount}][startingPosition]" data-name="Starting Position" id="startingPosition_${employmentCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-startingPosition_${employmentCount}"></div>
            </div>
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="endingPosition_${employmentCount}" class="Input-Label" data-translate="ending_position">Ending Position</label>
                <input type="text" class="Input" maxlength="256" name="employment[${employmentCount}][endingPosition]" data-name="Ending Position" id="endingPosition_${employmentCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-endingPosition_${employmentCount}"></div>
            </div>
        </div>
        <div class="form-row Grid-Layout Desktop-2-Column [Utility] Flex Gap MD-Gap Tablet-1-Column Mobile-L-1-Column Mobile-P-1-Column">
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="supervisorName_${employmentCount}" class="Input-Label" data-translate="supervisor_name">Supervisor Name</label>
                <input type="text" class="Input" maxlength="256" name="employment[${employmentCount}][supervisorName]" data-name="Supervisor Name" id="supervisorName_${employmentCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-supervisorName_${employmentCount}"></div>
            </div>
            <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
                <label for="empPhoneNumber_${employmentCount}" class="Input-Label" data-translate="phone_number">Phone Number</label>
                <input type="tel" class="Input" maxlength="12" name="employment[${employmentCount}][phoneNumber]" data-name="Employment Phone" placeholder="XXX-XXX-XXXX" id="empPhoneNumber_${employmentCount}">
                <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-empPhoneNumber_${employmentCount}"></div>
            </div>
        </div>
        <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
            <label for="responsibilities_${employmentCount}" class="Input-Label" data-translate="responsibilities">Responsibilities</label>
            <textarea class="Input Text-Area" maxlength="5000" name="employment[${employmentCount}][responsibilities]" data-name="Responsibilities" id="responsibilities_${employmentCount}" rows="3"></textarea>
            <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-responsibilities_${employmentCount}"></div>
        </div>
        <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
            <label for="reasonLeaving_${employmentCount}" class="Input-Label" data-translate="reason_leaving">Reason for Leaving</label>
            <textarea class="Input Text-Area" maxlength="5000" name="employment[${employmentCount}][reasonLeaving]" data-name="Reason Leaving" id="reasonLeaving_${employmentCount}" rows="2"></textarea>
            <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-reasonLeaving_${employmentCount}"></div>
        </div>
        <div class="field-wrapper w-field-wrapper [Utility] Margin Bottom MD-Gap">
            <label class="Input-Label" data-translate="may_contact_employer">May we contact this employer?</label>
            <div class="radio-button-group [Utility] Flex Horizontal [Utility] Flex Gap MD-Gap [Utility] Margin Top XXS-Gap">
                <label class="radio-button-field Radio-Toggle">
                    <input type="radio" id="mayContact_${employmentCount}_yes" name="employment[${employmentCount}][mayContact]" value="yes" data-name="May Contact">
                    <span class="radio-button-label Input-Label" for="mayContact_${employmentCount}_yes" data-translate="yes">Yes</span>
                </label>
                <label class="radio-button-field Radio-Toggle">
                    <input type="radio" id="mayContact_${employmentCount}_no" name="employment[${employmentCount}][mayContact]" value="no" data-name="May Contact">
                    <span class="radio-button-label Input-Label" for="mayContact_${employmentCount}_no" data-translate="no">No</span>
                </label>
            </div>
            <div class="field-error Text-Error [Utility] Margin Top XXS-Gap" id="error-mayContact_${employmentCount}"></div>
        </div>
        <button type="button" class="Button Secondary [Utility] Margin Top MD-Gap remove-entry-button" data-translate="remove_entry" onclick="removeEmploymentEntry(this)">Remove Entry</button>
    `;
    
    container.appendChild(newEntryDiv);
    employmentCount++;
    applyTranslations(currentLanguage); // Apply translations to new elements
    // Re-add phone formatter to new entry
    const phoneInput = newEntryDiv.querySelector('input[type="tel"]');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.substring(0,3) + '-' + value.substring(3,6) + '-' + value.substring(6,10);
            } else if (value.length >= 3) {
                value = value.substring(0,3) + '-' + value.substring(3);
            }
            e.target.value = value;
        });
    }
    auditLog.log('employment_entry_added', { entryNumber: employmentCount - 1 });
}

// Remove entry functions (global scope for onclick)
window.removeEducationEntry = function(button) {
    button.parentElement.remove();
    educationCount--;
    auditLog.log('education_entry_removed');
};

window.removeEmploymentEntry = function(button) {
    button.parentElement.remove();
    employmentCount--;
    auditLog.log('employment_entry_removed');
};

// Navigation functions
async function nextPage() {
    // Store current page data before navigating
    saveFormData(currentPage);

    if (currentPage < totalPages) {
        if (validateCurrentPage()) {
            if (currentPage === totalPages - 1) {
                // Ensure review page is loaded before generating content
                await loadPageContent(totalPages); // Load review page HTML
                generateReview(); // Populate review content
            }
            currentPage++;
            await showPage(currentPage); // Await page loading
            updateProgress();
            auditLog.log('page_navigation', { action: 'next', page: currentPage });
        }
    } else {
        handleFormSubmit();
    }
}

async function previousPage() {
    // Store current page data before navigating
    saveFormData(currentPage);

    if (currentPage > 1) {
        currentPage--;
        await showPage(currentPage); // Await page loading
        updateProgress();
        auditLog.log('page_navigation', { action: 'previous', page: currentPage });
    }
}

/**
 * Loads the HTML content for a given page number into the pageContentContainer.
 * @param {number} pageNum The page number to load.
 */
async function loadPageContent(pageNum) {
    showLoading(true);
    const pageUrl = CONFIG.PAGE_URLS[pageNum];
    if (!pageUrl) {
        console.error(`No URL found for page ${pageNum}`);
        showMessage('Error loading page content.', 'error');
        showLoading(false);
        return;
    }

    try {
        auditLog.log('page_content_load_started', { page: pageNum, url: pageUrl });
        const response = await fetch(pageUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const htmlContent = await response.text();
        const pageContentContainer = document.getElementById('pageContentContainer');
        if (pageContentContainer) {
            // Clear previous content and insert new page
            pageContentContainer.innerHTML = htmlContent;
            // Re-initialize elements on the new page
            initializePageElements();
            applyTranslations(currentLanguage); // Apply translations after content is loaded
            auditLog.log('page_content_load_success', { page: pageNum });
        }
    } catch (error) {
        console.error(`Failed to load content for page ${pageNum}:`, error);
        showMessage('Failed to load page content. Please try again.', 'error');
        auditLog.log('page_content_load_error', { page: pageNum, error: error.message });
    } finally {
        showLoading(false);
    }
}

async function showPage(pageNum) {
    // Load the content if it's not already loaded or if navigating to a different page
    const currentPageElement = document.getElementById(`page${pageNum}`);
    if (!currentPageElement || !currentPageElement.parentElement || currentPageElement.parentElement.id !== 'pageContentContainer') {
        await loadPageContent(pageNum);
    }

    // Hide all pages within the container and show only the active one
    document.querySelectorAll('.page-content-container > .page').forEach(page => {
        page.classList.remove('active');
    });
    
    const newPageElement = document.getElementById(`page${pageNum}`);
    if (newPageElement) {
        newPageElement.classList.add('active');
    }
    
    updateNavigationButtons();
    updateStepIndicators();
    updatePageIndicator();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    
    if (prevButton) {
        prevButton.disabled = currentPage === 1;
    }
    
    if (nextButton) {
        if (currentPage === totalPages) {
            nextButton.textContent = translations[currentLanguage]['submit_application'] || 'Submit Application';
        } else {
            nextButton.textContent = translations[currentLanguage]['next'] || 'Next';
        }
    }
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const percentage = (currentPage / totalPages) * 100;
        progressFill.style.width = percentage + '%';
    }
}

function updateStepIndicators() {
    for (let i = 1; i <= totalPages; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) {
            step.classList.remove('active', 'completed');
            
            if (i < currentPage) {
                step.classList.add('completed');
            } else if (i === currentPage) {
                step.classList.add('active');
            }
        }
    }
}

function updatePageIndicator() {
    const pageIndicator = document.getElementById('pageIndicator');
    if (pageIndicator) {
        const pageText = translations[currentLanguage]['page_indicator'] || 'Page {current} of {total}';
        pageIndicator.textContent = pageText.replace('{current}', currentPage).replace('{total}', totalPages);
    }
}

// Form validation
function validateCurrentPage() {
    // Collect data for the current page before validation
    saveFormData(currentPage);

    const currentPageElement = document.getElementById(`page${currentPage}`);
    if (!currentPageElement) return true;
    
    let isValid = true;
    
    // Check required fields
    const requiredFields = currentPageElement.querySelectorAll('input[required], select[required], textarea[required]');
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Document validation for page 4
    if (currentPage === 4) {
        // Check ID document
        if (!uploadedDocuments.identification) {
            showMessage('Please upload a government-issued photo ID.', 'error');
            isValid = false;
        }
        
        // Check certifications
        if (!uploadedDocuments.certifications || uploadedDocuments.certifications.length === 0) {
            showMessage('Please upload at least one certification or license document.', 'error');
            isValid = false;
        }
    }
    
    if (!isValid) {
        const errorMessage = translations[currentLanguage]['validation_error'] || 'Please fill in all required fields before continuing.';
        if (currentPage !== 4) { // Don't show generic message for document page
            showMessage(errorMessage, 'error');
        }
    }
    
    return isValid;
}

function validateField(field) {
    const errorElement = document.getElementById(`error-${field.id}`);
    let isValid = true;

    if (field.hasAttribute('required') && field.value.trim() === '') {
        isValid = false;
        if (errorElement) errorElement.textContent = translations[currentLanguage]['field_required'] || 'This field is required.';
    } else if (field.type === 'email' && field.value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        isValid = false;
        if (errorElement) errorElement.textContent = translations[currentLanguage]['invalid_email'] || 'Invalid email format.';
    } else if (field.id === 'socialSecurityNumber' && field.value.trim() !== '' && !/^\d{3}-\d{2}-\d{4}$/.test(field.value)) {
        isValid = false;
        if (errorElement) errorElement.textContent = translations[currentLanguage]['invalid_ssn'] || 'Invalid SSN format (XXX-XX-XXXX).';
    } else if (field.type === 'tel' && field.value.trim() !== '' && !/^\d{3}-\d{3}-\d{4}$/.test(field.value)) {
        isValid = false;
        if (errorElement) errorElement.textContent = translations[currentLanguage]['invalid_phone'] || 'Invalid phone format (XXX-XXX-XXXX).';
    } else if (field.id === 'zipCode' && field.value.trim() !== '' && !/^\d{5}(-\d{4})?$/.test(field.value)) {
        isValid = false;
        if (errorElement) errorElement.textContent = translations[currentLanguage]['invalid_zip'] || 'Invalid ZIP code format.';
    } else {
        if (errorElement) errorElement.textContent = ''; // Clear error message
    }
    
    if (isValid) {
        field.style.borderColor = '';
        field.style.backgroundColor = '';
        if (errorElement) errorElement.style.display = 'none';
    } else {
        field.style.borderColor = '#dc3545';
        field.style.backgroundColor = '#fff5f5';
        if (errorElement) errorElement.style.display = 'block';
    }
    
    return isValid;
}

// Store form data when navigating away from a page
function saveFormData(pageNum) {
    const form = document.getElementById('applicationForm');
    if (!form) return;

    const inputs = form.querySelectorAll(`#page${pageNum} input, #page${pageNum} select, #page${pageNum} textarea`);
    inputs.forEach(input => {
        const name = input.name;
        if (!name) return;

        if (input.type === 'radio') {
            if (input.checked) {
                formDataStore[name] = input.value;
            }
        } else if (name.includes('[') && name.includes(']')) {
            // Handle array inputs like education[0][schoolName]
            const match = name.match(/(\w+)\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const [, section, index, field] = match;
                if (!formDataStore[section]) formDataStore[section] = [];
                if (!formDataStore[section][index]) formDataStore[section][index] = {};
                formDataStore[section][index][field] = input.value;
            }
        } else {
            formDataStore[name] = input.value;
        }
    });

    // Handle repeatable sections: filter out empty entries
    if (formDataStore.education) {
        formDataStore.education = formDataStore.education.filter(entry => 
            entry && Object.values(entry).some(val => val && val.trim() !== '')
        );
    }
    if (formDataStore.employment) {
        formDataStore.employment = formDataStore.employment.filter(entry => 
            entry && Object.values(entry).some(val => val && val.trim() !== '')
        );
    }
    auditLog.log('form_data_saved', { page: pageNum, dataKeys: Object.keys(formDataStore) });
}

// Restore form data when navigating to a page
function restoreFormData(pageNum) {
    const form = document.getElementById('applicationForm');
    if (!form) return;

    const inputs = form.querySelectorAll(`#page${pageNum} input, #page${pageNum} select, #page${pageNum} textarea`);
    inputs.forEach(input => {
        const name = input.name;
        if (!name || !formDataStore.hasOwnProperty(name) && !name.includes('[') ) return; // Check for simple keys or array keys

        if (input.type === 'radio') {
            if (formDataStore[name] === input.value) {
                input.checked = true;
            }
        } else if (name.includes('[') && name.includes(']')) {
            // Handle array inputs like education[0][schoolName]
            const match = name.match(/(\w+)\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const [, section, index, field] = match;
                if (formDataStore[section] && formDataStore[section][index] && formDataStore[section][index][field] !== undefined) {
                    input.value = formDataStore[section][index][field];
                }
            }
        } else {
            input.value = formDataStore[name] || '';
        }
    });

    // Special handling for repeatable sections for restoration
    // Clear existing dynamic entries and re-add based on stored data
    if (pageNum === 6 && formDataStore.education && formDataStore.education.length > 1) {
        const container = document.getElementById('educationContainer');
        // Remove all but the first (template) entry
        Array.from(container.children).slice(1).forEach(child => child.remove());
        educationCount = 1; // Reset counter

        for (let i = 1; i < formDataStore.education.length; i++) {
            addEducationEntry(); // This increments educationCount
            const newEntryDiv = document.querySelector(`.education-entry[data-index="${i}"]`);
            if (newEntryDiv) {
                for (const field in formDataStore.education[i]) {
                    const inputElement = newEntryDiv.querySelector(`[name="education[${i}][${field}]"]`);
                    if (inputElement) {
                        if (inputElement.type === 'radio') {
                            newEntryDiv.querySelector(`input[name="education[${i}][${field}]"][value="${formDataStore.education[i][field]}"]`).checked = true;
                        } else {
                            inputElement.value = formDataStore.education[i][field];
                        }
                    }
                }
            }
        }
    }
    if (pageNum === 7 && formDataStore.employment && formDataStore.employment.length > 1) {
        const container = document.getElementById('employmentContainer');
        // Remove all but the first (template) entry
        Array.from(container.children).slice(1).forEach(child => child.remove());
        employmentCount = 1; // Reset counter

        for (let i = 1; i < formDataStore.employment.length; i++) {
            addEmploymentEntry(); // This increments employmentCount
            const newEntryDiv = document.querySelector(`.employment-entry[data-index="${i}"]`);
            if (newEntryDiv) {
                for (const field in formDataStore.employment[i]) {
                    const inputElement = newEntryDiv.querySelector(`[name="employment[${i}][${field}]"]`);
                    if (inputElement) {
                        if (inputElement.type === 'radio') {
                            newEntryDiv.querySelector(`input[name="employment[${i}][${field}]"][value="${formDataStore.employment[i][field]}"]`).checked = true;
                        } else {
                            inputElement.value = formDataStore.employment[i][field];
                        }
                    }
                }
            }
        }
    }
    auditLog.log('form_data_restored', { page: pageNum, dataKeys: Object.keys(formDataStore) });
}


// Generate review page
function generateReview() {
    // Ensure all latest data is in formDataStore before generating review
    saveFormData(currentPage); 
    const reviewContent = document.getElementById('reviewContent');
    
    if (!reviewContent) return;
    
    let html = '';
    
    // Personal Information
    html += '<div class="review-section [Utility] Margin Bottom LG-Gap [Utility] Padding Bottom MD-Gap [Utility] Border Bottom 1px Border-Secondary">';
    html += '<h4 class="Text-Accent-Primary [Utility] Margin Bottom MD-Gap [Utility] Font Size L [Utility] Font Weight 600" data-translate="personal_info">Personal Information</h4>';
    html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong class="Text-Primary [Utility] Min Width 150px" data-translate="name">Name:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${formDataStore.legalFirstName || ''} ${formDataStore.middleInitial || ''} ${formDataStore.legalLastName || ''}</span></div>`;
    html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong class="Text-Primary [Utility] Min Width 150px" data-translate="address">Address:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${formDataStore.streetAddress || ''} ${formDataStore.aptNumber || ''}, ${formDataStore.city || ''}, ${formDataStore.state || ''} ${formDataStore.zipCode || ''}</span></div>`;
    html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong class="Text-Primary [Utility] Min Width 150px" data-translate="phone">Phone:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${formDataStore.phoneNumber || ''}</span></div>`;
    html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong>SSN:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${formDataStore.socialSecurityNumber ? '***-**-' + formDataStore.socialSecurityNumber.slice(-4) : ''}</span></div>`;
    html += '</div>';
    
    // Contact Information
    if (formDataStore.email || formDataStore.emergencyName) {
        html += '<div class="review-section [Utility] Margin Bottom LG-Gap [Utility] Padding Bottom MD-Gap [Utility] Border Bottom 1px Border-Secondary">';
        html += '<h4 class="Text-Accent-Primary [Utility] Margin Bottom MD-Gap [Utility] Font Size L [Utility] Font Weight 600" data-translate="contact_details">Contact Details</h4>';
        if (formDataStore.email) html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong>Email:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${formDataStore.email}</span></div>`;
        if (formDataStore.emergencyName) html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong>Emergency Contact:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${formDataStore.emergencyName} (${formDataStore.emergencyRelationship || ''}) - ${formDataStore.emergencyPhone || ''}</span></div>`;
        html += '</div>';
    }
    
    // Document Information
    html += '<div class="review-section [Utility] Margin Bottom LG-Gap [Utility] Padding Bottom MD-Gap [Utility] Border Bottom 1px Border-Secondary">';
    html += '<h4 class="Text-Accent-Primary [Utility] Margin Bottom MD-Gap [Utility] Font Size L [Utility] Font Weight 600" data-translate="documents_submitted">Documents Submitted</h4>';
    html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong>ID Document:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${uploadedDocuments.identification ? '✅ Provided' : '❌ Not provided'}</span></div>`;
    html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong>Resume:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${uploadedDocuments.resume ? '✅ Provided' : '❌ Not provided'}</span></div>`;
    html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong>Certifications:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${uploadedDocuments.certifications.length > 0 ? '✅ ' + uploadedDocuments.certifications.length + ' files' : '❌ None provided'}</span></div>`;
    html += '</div>';
    
    // Application Information
    if (formDataStore.positionApplied || formDataStore.expectedSalary) {
        html += '<div class="review-section [Utility] Margin Bottom LG-Gap [Utility] Padding Bottom MD-Gap [Utility] Border Bottom 1px Border-Secondary">';
        html += '<h4 class="Text-Accent-Primary [Utility] Margin Bottom MD-Gap [Utility] Font Size L [Utility] Font Weight 600" data-translate="application_info">Application Information</h4>';
        if (formDataStore.positionApplied) html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong class="Text-Primary [Utility] Min Width 150px" data-translate="position">Position:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${formDataStore.positionApplied}</span></div>`;
        if (formDataStore.expectedSalary) html += `<div class="review-item [Utility] Display Flex [Utility] Justify Content Space-Between [Utility] Padding All XXS-Gap [Utility] Border Bottom 1px Border-Secondary md:Flex-Vertical md:Flex-Gap XXS-Gap"><strong>Expected Salary:</strong> <span class="Text-Secondary [Utility] Text Align Right [Utility] Flex Expand">${formDataStore.expectedSalary}</span></div>`;
        html += '</div>';
    }
    
    reviewContent.innerHTML = html;
    applyTranslations(currentLanguage);
}

// Form submission
async function handleFormSubmit() {
    try {
        const nextButton = document.getElementById('nextButton');
        if (nextButton) {
            nextButton.disabled = true;
            nextButton.textContent = translations[currentLanguage]['submitting'] || 'Submitting...';
        }
        
        auditLog.log('form_submission_started');
        
        // Ensure all data is collected before submission
        saveFormData(currentPage); 
        const finalFormData = { ...formDataStore }; // Use the stored data
        
        // Add documents to form data (now includes Base64 content)
        finalFormData.documents = await prepareDocumentsForSubmission();
        finalFormData.auditLog = auditLog.actions;
        finalFormData.language = currentLanguage;
        finalFormData.submissionTime = new Date().toISOString();
        finalFormData.sessionId = auditLog.sessionId;
        
        const response = await submitToNetlify(finalFormData);
        
        if (response.success) {
            auditLog.log('form_submission_success', { responseId: response.id });
            const successMessage = translations[currentLanguage]['submission_success'] || 'Application submitted successfully!';
            
            showMessage(successMessage, 'success');
            
            // Hide form and navigation
            document.getElementById('applicationForm').style.display = 'none';
            document.querySelector('.form-navigation').style.display = 'none';
            document.querySelector('.progress-container').style.display = 'none';
        } else {
            throw new Error(response.error || 'Submission failed');
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        auditLog.log('form_submission_error', { error: error.message });
        const errorMessage = translations[currentLanguage]['submission_error'] || 'Error submitting application. Please try again.';
        showMessage(errorMessage + ' ' + error.message, 'error');
    } finally {
        const nextButton = document.getElementById('nextButton');
        if (nextButton) {
            nextButton.disabled = false;
            nextButton.textContent = translations[currentLanguage]['submit_application'] || 'Submit Application';
        }
    }
}

/**
 * Converts uploaded File objects into an array of objects containing file metadata and Base64 content.
 * @returns {Promise<Object>} An object containing identification, resume, and certifications with Base64 data.
 */
async function prepareDocumentsForSubmission() {
    const documents = {
        identification: null,
        resume: null,
        certifications: []
    };

    if (uploadedDocuments.identification) {
        documents.identification = {
            name: uploadedDocuments.identification.name,
            size: uploadedDocuments.identification.size,
            type: uploadedDocuments.identification.type,
            data: await readFileAsBase64(uploadedDocuments.identification)
        };
    }

    if (uploadedDocuments.resume) {
        documents.resume = {
            name: uploadedDocuments.resume.name,
            size: uploadedDocuments.resume.size,
            type: uploadedDocuments.resume.type,
            data: await readFileAsBase64(uploadedDocuments.resume)
        };
    }

    for (const file of uploadedDocuments.certifications) {
        documents.certifications.push({
            name: file.name,
            size: file.size,
            type: file.type,
            data: await readFileAsBase64(file)
        });
    }

    return documents;
}

/**
 * Reads a File object and converts its content to a Base64 string.
 * @param {File} file The File object to read.
 * @returns {Promise<string>} A Promise that resolves with the Base64 string of the file.
 */
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the "data:mime/type;base64," prefix
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Collect form data (now uses formDataStore)
function collectFormData() {
    // This function is now primarily for initial setup or debugging
    // The actual data collection happens in saveFormData
    return formDataStore;
}

// Submit to Netlify function
async function submitToNetlify(data) {
    const submitUrl = secureConfig.SUBMIT_URL || CONFIG.NETLIFY_SUBMIT_URL;
    
    const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Utility functions
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message visible ${type}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusMessage.className = 'status-message';
        }, 5000);
    }
}

function createFallbackTranslations() {
    translations = {
        en: {
            'step_personal': 'Personal Info',
            'step_contact': 'Contact',
            'step_status': 'Status',
            'step_documents': 'Documents',
            'step_application': 'Application',
            'step_education': 'Education',
            'step_employment': 'Employment',
            'step_review': 'Review',
            'contact_info_subtitle': 'Additional contact details to help us reach you',
            'optional_field_note': 'This information is optional but helps us serve you better',
            'citizenship_subtitle': 'This information will be verified during the I-9 process',
            'documents_title': 'Required Documents',
            'documents_subtitle': 'Please upload the required documents for your application',
            'application_questions_subtitle': 'Please answer as completely as possible',
            'education_subtitle': 'Providing your educational background helps us understand your qualifications',
            'employment_subtitle': 'Your work history helps us better evaluate your experience',
            'previous': 'Previous',
            'next': 'Next',
            'submit_application': 'Submit Application',
            'submitting': 'Submitting...',
            'page_indicator': 'Page {current} of {total}',
            'yes': 'Yes',
            'no': 'No',
            'loading_application': 'Loading application...',
            'validation_error': 'Please fill in all required fields before continuing.',
            'submission_success': 'Application submitted successfully!',
            'submission_error': 'Error submitting application. Please try again.',
            'field_required': 'This field is required.',
            'invalid_email': 'Invalid email format.',
            'invalid_ssn': 'Invalid SSN format (XXX-XX-XXXX).',
            'invalid_phone': 'Invalid phone format (XXX-XXX-XXXX).',
            'invalid_zip': 'Invalid ZIP code format.',
            'school_name': 'School Name and Location',
            'graduation_year': 'Year',
            'major_field': 'Major/Field of Study',
            'diploma_degree': 'Diploma/Degree?',
            'remove_entry': 'Remove Entry',
            'add_another_school': 'Add Another School',
            'company_name': 'Company Name and Location',
            'date_started': 'Date Started (MM/DD/YYYY)',
            'date_ended': 'Date Ended (MM/DD/YYYY)',
            'starting_position': 'Starting Position',
            'ending_position': 'Ending Position',
            'supervisor_name': 'Supervisor Name',
            'responsibilities': 'Responsibilities',
            'reason_leaving': 'Reason for Leaving',
            'may_contact_employer': 'May we contact this employer?',
            'add_another_employer': 'Add Another Employer',
            'personal_info': 'Personal Information',
            'name': 'Name',
            'address': 'Address',
            'phone': 'Phone',
            'contact_details': 'Contact Details',
            'documents_submitted': 'Documents Submitted',
            'application_info': 'Application Information',
            'position': 'Position'
        },
        es: {
            'step_personal': 'Info Personal',
            'step_contact': 'Contacto',
            'step_status': 'Estado',
            'step_documents': 'Documentos',
            'step_application': 'Aplicación',
            'step_education': 'Educación',
            'step_employment': 'Empleo',
            'step_review': 'Revisar',
            'contact_info_subtitle': 'Detalles de contacto adicionales para comunicarnos con usted',
            'optional_field_note': 'Esta información es opcional pero nos ayuda a atenderle mejor',
            'citizenship_subtitle': 'Esta información será verificada durante el proceso I-9',
            'documents_title': 'Documentos Requeridos',
            'documents_subtitle': 'Por favor suba los documentos requeridos para su aplicación',
            'application_questions_subtitle': 'Por favor responda lo más completamente posible',
            'education_subtitle': 'Proporcionar su historial educativo nos ayuda a entender sus calificaciones',
            'employment_subtitle': 'Su historial laboral nos ayuda a evaluar mejor su experiencia',
            'previous': 'Anterior',
            'next': 'Siguiente',
            'submit_application': 'Enviar Aplicación',
            'submitting': 'Enviando...',
            'page_indicator': 'Página {current} de {total}',
            'yes': 'Sí',
            'no': 'No',
            'loading_application': 'Cargando aplicación...',
            'validation_error': 'Por favor complete todos los campos requeridos antes de continuar.',
            'submission_success': '¡Aplicación enviada exitosamente!',
            'submission_error': 'Error al enviar la aplicación. Por favor intente nuevamente.',
            'field_required': 'Este campo es requerido.',
            'invalid_email': 'Formato de correo electrónico inválido.',
            'invalid_ssn': 'Formato de SSN inválido (XXX-XX-XXXX).',
            'invalid_phone': 'Formato de teléfono inválido (XXX-XXX-XXXX).',
            'invalid_zip': 'Formato de código postal inválido.',
            'school_name': 'Nombre y Ubicación de la Escuela',
            'graduation_year': 'Año',
            'major_field': 'Especialidad/Campo de Estudio',
            'diploma_degree': '¿Diploma/Grado?',
            'remove_entry': 'Eliminar Entrada',
            'add_another_school': 'Añadir Otra Escuela',
            'company_name': 'Nombre y Ubicación de la Empresa',
            'date_started': 'Fecha de Inicio (MM/DD/AAAA)',
            'date_ended': 'Fecha de Fin (MM/DD/AAAA)',
            'starting_position': 'Puesto Inicial',
            'ending_position': 'Puesto Final',
            'supervisor_name': 'Nombre del Supervisor',
            'responsibilities': 'Responsabilidades',
            'reason_leaving': 'Razón para Dejar el Empleo',
            'may_contact_employer': '¿Podemos contactar a este empleador?',
            'add_another_employer': 'Añadir Otro Empleador',
            'personal_info': 'Información Personal',
            'name': 'Nombre',
            'address': 'Dirección',
            'phone': 'Teléfono',
            'contact_details': 'Detalles de Contacto',
            'documents_submitted': 'Documentos Enviados',
            'application_info': 'Información de la Aplicación',
            'position': 'Puesto'
        }
    };
}

// Security: Clear sensitive data on page unload
window.addEventListener('beforeunload', function() {
    auditLog.log('page_unload');
    
    const sensitiveFields = ['socialSecurityNumber', 'uscisANumber', 'alienDocumentNumber'];
    sensitiveFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
});

// Make navigation functions available globally
window.nextPage = nextPage;
window.previousPage = previousPage;
