// Simple WareWorks Form - Clean Implementation
let currentPage = 1;
const totalPages = 8;
let formData = {};

// Page URLs
const pageUrls = {
    1: 'https://wareworks-backend.netlify.app/form-pages/page1-personal-info.html',
    2: 'https://wareworks-backend.netlify.app/form-pages/page2-contact.html',
    3: 'https://wareworks-backend.netlify.app/form-pages/page3-citizenship.html',
    4: 'https://wareworks-backend.netlify.app/form-pages/page4-documents.html',
    5: 'https://wareworks-backend.netlify.app/form-pages/page5-application-questions.html',
    6: 'https://wareworks-backend.netlify.app/form-pages/page6-education-history.html',
    7: 'https://wareworks-backend.netlify.app/form-pages/page7-employment-history.html',
    8: 'https://wareworks-backend.netlify.app/form-pages/page8-review-submit.html'
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simple form initializing...');
    setupGlobalFunctions();
});

function setupGlobalFunctions() {
    // Make functions globally available
    window.acceptDisclaimer = acceptDisclaimer;
    window.nextPage = nextPage;
    window.previousPage = previousPage;
    console.log('Global functions ready');
}

function acceptDisclaimer(language) {
    console.log('Accept disclaimer called:', language);
    
    // Hide disclaimer
    const disclaimer = document.getElementById('languageDisclaimer');
    if (disclaimer) {
        disclaimer.style.display = 'none';
    }
    
    // Show main form
    const mainContainer = document.getElementById('mainFormContainer');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
    
    // Load all pages content first, then show page 1
    loadAllPagesContent().then(() => {
        loadPage(1);
    }).catch(() => {
        // Fallback to original multi-page mode
        loadPage(1);
    });
}

async function loadAllPagesContent() {
    console.log('Loading all pages content...');
    
    try {
        const response = await fetch('https://wareworks-backend.netlify.app/form-pages/all-pages-content.html');
        if (!response.ok) {
            throw new Error('Failed to load all pages content');
        }
        
        const html = await response.text();
        
        // Insert all pages into the container
        const container = document.getElementById('pageContentContainer');
        if (container) {
            container.innerHTML = html;
            console.log('All pages content loaded successfully');
        }
        
        return true;
    } catch (error) {
        console.error('Error loading all pages content:', error);
        throw error;
    }
}

async function loadPage(pageNum) {
    console.log('Loading page:', pageNum);
    
    try {
        // Show loading
        showLoading(true);
        
        // Check if we're in single-page mode (all pages already loaded)
        const allPagesContainer = document.getElementById('allFormPages');
        const targetPage = document.getElementById(`page${pageNum}`);
        
        if (allPagesContainer && targetPage) {
            // Single-page mode: just show/hide pages
            console.log('Single-page mode: switching to page', pageNum);
            
            // Hide all pages
            document.querySelectorAll('.form-page').forEach(page => {
                page.classList.remove('active');
                page.style.display = 'none';
            });
            
            // Show target page
            targetPage.classList.add('active');
            targetPage.style.display = 'block';
            
            // Initialize page-specific functionality
            initializePage(pageNum);
        } else {
            // Original multi-page mode: fetch content
            console.log('Multi-page mode: fetching page', pageNum);
            
            // Get page content
            const response = await fetch(pageUrls[pageNum]);
            if (!response.ok) {
                throw new Error(`Failed to load page ${pageNum}`);
            }
            
            const html = await response.text();
            
            // Insert into container
            const container = document.getElementById('pageContentContainer');
            if (container) {
                container.innerHTML = html;
                
                // Hide any style tags that might be visible
                const styleTags = container.querySelectorAll('style');
                styleTags.forEach(style => style.style.display = 'none');
                
                // Initialize page-specific functionality
                initializePage(pageNum);
            }
        }
        
        // Update UI
        currentPage = pageNum;
        updateProgress();
        updateButtons();
        
        console.log('Page loaded successfully:', pageNum);
        
    } catch (error) {
        console.error('Error loading page:', error);
        showMessage('Error loading page. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function initializePage(pageNum) {
    // Page-specific initialization
    if (pageNum === 1) {
        setupAddressAutocomplete();
        setupInputFormatters();
    } else if (pageNum === 4) {
        setupDocumentUploads();
    } else if (pageNum === 8) {
        setupReviewPage();
    }
    
    // Restore form data first
    restoreFormData();
    
    // Save form data when inputs change
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', saveFormData);
        input.addEventListener('input', saveFormData);
    });
}

function setupAddressAutocomplete() {
    const addressInput = document.getElementById('streetAddress');
    if (!addressInput) return;
    
    console.log('Setting up address autocomplete for:', addressInput);
    
    // Load Google Maps API if not already loaded
    if (!window.google) {
        loadGoogleMapsAPI().then(() => {
            initializeAutocomplete(addressInput);
        }).catch(error => {
            console.error('Failed to load Google Maps API:', error);
        });
    } else {
        initializeAutocomplete(addressInput);
    }
}

function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.google && window.google.maps) {
            resolve();
            return;
        }
        
        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            // Wait for existing script to load
            existingScript.addEventListener('load', resolve);
            existingScript.addEventListener('error', reject);
            return;
        }
        
        // Create and load the script
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDQFBttRAtQDhfsQWHVk38RKWQ38tznMYY&libraries=places';
        script.async = true;
        script.defer = true;
        
        script.addEventListener('load', () => {
            console.log('Google Maps API loaded successfully');
            resolve();
        });
        
        script.addEventListener('error', () => {
            console.error('Failed to load Google Maps API');
            reject(new Error('Google Maps API failed to load'));
        });
        
        document.head.appendChild(script);
    });
}

function initializeAutocomplete(addressInput) {
    let autocompleteTimer;
    
    // Create datalist for suggestions
    let suggestionsList = document.getElementById('addressSuggestions');
    if (!suggestionsList) {
        suggestionsList = document.createElement('datalist');
        suggestionsList.id = 'addressSuggestions';
        document.body.appendChild(suggestionsList);
        addressInput.setAttribute('list', 'addressSuggestions');
    }
    
    addressInput.addEventListener('input', function(e) {
        const value = e.target.value.trim();
        
        // Clear previous timer
        clearTimeout(autocompleteTimer);
        
        if (value.length < 3) {
            suggestionsList.innerHTML = '';
            return;
        }
        
        // Debounce API calls
        autocompleteTimer = setTimeout(() => {
            try {
                console.log('Fetching address suggestions for:', value);
                
                // Use Google Maps JavaScript API for autocomplete
                if (window.google && window.google.maps && window.google.maps.places) {
                    const service = new google.maps.places.AutocompleteService();
                    
                    service.getPlacePredictions({
                        input: value,
                        types: ['address'],
                        componentRestrictions: { country: 'us' }
                    }, (predictions, status) => {
                        console.log('Google Maps API response:', predictions, status);
                        
                        // Clear previous suggestions
                        suggestionsList.innerHTML = '';
                        
                        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                            predictions.slice(0, 5).forEach(prediction => {
                                const option = document.createElement('option');
                                option.value = prediction.description;
                                option.dataset.placeId = prediction.place_id;
                                suggestionsList.appendChild(option);
                            });
                            console.log(`Added ${predictions.length} address suggestions`);
                        } else {
                            console.log('No address suggestions found or API error:', status);
                        }
                    });
                } else {
                    console.warn('Google Maps JavaScript API still loading...');
                }
                
            } catch (error) {
                console.error('Address autocomplete error:', error);
                // Don't show error to user - just fail silently
            }
        }, 300); // 300ms delay
    });
    
    // Handle address selection to populate other fields
    let isPopulating = false;
    addressInput.addEventListener('change', function(e) {
        const selectedAddress = e.target.value;
        if (selectedAddress && window.google && window.google.maps && !isPopulating) {
            isPopulating = true;
            populateAddressFields(selectedAddress).finally(() => {
                isPopulating = false;
            });
        }
    });
    
    console.log('Address autocomplete setup complete');
}

function populateAddressFields(address) {
    console.log('Populating address fields for:', address);
    
    if (!window.google || !window.google.maps) {
        console.warn('Google Maps API not available for address parsing');
        return Promise.reject(new Error('Google Maps API not available'));
    }
    
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
    
    geocoder.geocode({ address: address }, function(results, status) {
        if (status === 'OK' && results[0]) {
            const place = results[0];
            console.log('Geocoded address:', place);
            
            // Extract address components
            const components = place.address_components;
            let streetNumber = '';
            let route = '';
            let city = '';
            let state = '';
            let zipCode = '';
            
            components.forEach(component => {
                const types = component.types;
                
                if (types.includes('street_number')) {
                    streetNumber = component.long_name;
                } else if (types.includes('route')) {
                    route = component.long_name;
                } else if (types.includes('locality')) {
                    city = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                    state = component.short_name;
                } else if (types.includes('postal_code')) {
                    zipCode = component.long_name;
                }
            });
            
            // Populate the form fields
            const cityField = document.getElementById('city');
            const stateField = document.getElementById('state');
            const zipField = document.getElementById('zipCode');
            
            if (city && cityField) {
                cityField.value = city;
                console.log('Set city:', city);
            }
            
            if (state && stateField) {
                stateField.value = state;
                console.log('Set state:', state);
            }
            
            if (zipCode && zipField) {
                zipField.value = zipCode;
                console.log('Set zip code:', zipCode);
            }
            
            // Update the street address with proper formatting
            const streetAddress = `${streetNumber} ${route}`.trim();
            const addressField = document.getElementById('streetAddress');
            if (streetAddress && addressField) {
                addressField.value = streetAddress;
                console.log('Set street address:', streetAddress);
            }
            
            // Trigger change events to save data (but prevent recursion)
            [cityField, stateField, zipField].forEach(field => {
                if (field) {
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            
            resolve();
        } else {
            console.warn('Geocoding failed:', status);
            reject(new Error('Geocoding failed: ' + status));
        }
    });
    });
}

function setupDocumentUploads() {
    console.log('Setting up document uploads...');
    
    // Initialize each upload field
    const uploadFields = [
        { id: 'idDocument', multiple: false },
        { id: 'resumeDocument', multiple: false },
        { id: 'certificationDocuments', multiple: true }
    ];
    
    uploadFields.forEach(field => {
        setupFileUpload(field.id, field.multiple);
    });
    
    console.log('Document uploads initialized');
    
    // Make functions globally available for onclick handlers
    window.removeFile = removeFile;
}

function setupFileUpload(inputId, multiple = false) {
    const input = document.getElementById(inputId);
    const uploadArea = input?.parentElement.querySelector('.file-upload-area');
    const preview = document.getElementById(inputId + 'Preview');
    
    if (!input || !uploadArea || !preview) {
        console.warn(`Upload elements not found for ${inputId}`);
        return;
    }
    
    console.log(`Setting up file upload for ${inputId}`);
    
    // File selection handler
    input.addEventListener('change', function(e) {
        handleFileSelection(e.target.files, inputId, preview, multiple);
    });
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFileSelection(e.dataTransfer.files, inputId, preview, multiple);
    });
}

function handleFileSelection(files, inputId, preview, multiple) {
    if (!files || files.length === 0) return;
    
    console.log(`Handling file selection for ${inputId}:`, files);
    
    const validFiles = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateFile(file, inputId);
        
        if (validation.isValid) {
            validFiles.push(file);
        } else {
            errors.push(`${file.name}: ${validation.error}`);
        }
    }
    
    if (errors.length > 0) {
        showErrors(inputId, errors);
        return;
    }
    
    // Store files globally
    window.uploadedDocuments = window.uploadedDocuments || {};
    
    if (multiple) {
        window.uploadedDocuments[inputId] = validFiles;
    } else {
        window.uploadedDocuments[inputId] = validFiles[0];
    }
    
    updateFilePreview(inputId, preview);
    clearErrors(inputId);
    
    console.log(`Files stored for ${inputId}:`, window.uploadedDocuments[inputId]);
}

function validateFile(file, inputId) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
        return { isValid: false, error: 'File size exceeds 10MB limit' };
    }
    
    const allowedTypes = {
        idDocument: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        resumeDocument: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        certificationDocuments: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    };
    
    const allowed = allowedTypes[inputId];
    if (allowed && !allowed.includes(file.type)) {
        return { isValid: false, error: 'File type not allowed' };
    }
    
    return { isValid: true };
}

function updateFilePreview(inputId, preview) {
    preview.innerHTML = '';
    
    const documents = window.uploadedDocuments?.[inputId];
    if (!documents) return;
    
    const files = Array.isArray(documents) ? documents : [documents];
    
    files.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'file-preview-item';
        
        const icon = getFileIcon(file.type);
        const size = formatFileSize(file.size);
        
        previewItem.innerHTML = `
            <div class="file-preview-icon">${icon}</div>
            <div class="file-preview-info">
                <div class="file-preview-name">${file.name}</div>
                <div class="file-preview-size">${size}</div>
            </div>
            <button type="button" class="file-preview-remove" onclick="removeFile('${inputId}', ${index})">
                Remove
            </button>
        `;
        
        preview.appendChild(previewItem);
    });
    
    // Update upload area appearance
    const uploadArea = document.querySelector(`#${inputId}`).parentElement.querySelector('.file-upload-area');
    if (uploadArea) {
        uploadArea.classList.add('has-files');
    }
}

function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return '📷';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    return '📎';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function removeFile(inputId, index) {
    const documents = window.uploadedDocuments?.[inputId];
    if (!documents) return;
    
    if (Array.isArray(documents)) {
        documents.splice(index, 1);
        if (documents.length === 0) {
            delete window.uploadedDocuments[inputId];
        }
    } else {
        delete window.uploadedDocuments[inputId];
    }
    
    const preview = document.getElementById(inputId + 'Preview');
    updateFilePreview(inputId, preview);
    
    // Clear the input
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
    }
}

function showErrors(inputId, errors) {
    const errorElement = document.getElementById(`error-${inputId}`);
    if (errorElement) {
        errorElement.textContent = errors.join(', ');
        errorElement.classList.add('visible');
    }
}

function clearErrors(inputId) {
    const errorElement = document.getElementById(`error-${inputId}`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('visible');
    }
}

function setupInputFormatters() {
    // Phone number formatting
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        // Remove the maxlength attribute to prevent conflicts
        phoneInput.removeAttribute('maxlength');
        
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            // Limit to 10 digits max
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            
            // Format the phone number
            if (value.length >= 6) {
                value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
            } else if (value.length >= 3) {
                value = `(${value.slice(0,3)}) ${value.slice(3)}`;
            }
            
            e.target.value = value;
        });
        
        // Handle backspace and delete properly
        phoneInput.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const cursorPos = e.target.selectionStart;
                const value = e.target.value;
                
                // If cursor is on a formatting character, move cursor back
                if (cursorPos > 0 && /[\(\)\s\-]/.test(value[cursorPos - 1])) {
                    setTimeout(() => {
                        e.target.setSelectionRange(cursorPos - 1, cursorPos - 1);
                    }, 0);
                }
            }
        });
    }
    
    // SSN formatting
    const ssnInput = document.getElementById('socialSecurityNumber');
    if (ssnInput) {
        // Remove the maxlength attribute to prevent conflicts
        ssnInput.removeAttribute('maxlength');
        
        ssnInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            // Limit to 9 digits max
            if (value.length > 9) {
                value = value.slice(0, 9);
            }
            
            // Format the SSN
            if (value.length >= 5) {
                value = `${value.slice(0,3)}-${value.slice(3,5)}-${value.slice(5,9)}`;
            } else if (value.length >= 3) {
                value = `${value.slice(0,3)}-${value.slice(3)}`;
            }
            
            e.target.value = value;
        });
        
        // Handle backspace and delete properly
        ssnInput.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const cursorPos = e.target.selectionStart;
                const value = e.target.value;
                
                // If cursor is on a dash, move cursor back
                if (cursorPos > 0 && value[cursorPos - 1] === '-') {
                    setTimeout(() => {
                        e.target.setSelectionRange(cursorPos - 1, cursorPos - 1);
                    }, 0);
                }
            }
        });
    }
}

function setupReviewPage() {
    console.log('Setting up review page...');
    
    // Remove the duplicate submit button from page content
    const finalSubmitBtn = document.getElementById('finalSubmitBtn');
    if (finalSubmitBtn) {
        finalSubmitBtn.style.display = 'none';
        console.log('Hidden duplicate submit button');
    }
    
    // Hide any other duplicate submit buttons
    const pageSubmitButtons = document.querySelectorAll('#pageContentContainer button[type="submit"], #pageContentContainer .submit-button');
    pageSubmitButtons.forEach(btn => {
        if (btn.id !== 'finalSubmitBtn') { // Don't double-hide the main one
            btn.style.display = 'none';
        }
    });
    
    // Ensure the navigation submit button is visible and properly labeled
    const nextBtn = document.getElementById('nextButton');
    if (nextBtn) {
        nextBtn.textContent = 'Submit Application';
        nextBtn.style.background = 'linear-gradient(135deg, #131f5b 0%, #1e308e 100%)';
        nextBtn.style.color = 'white';
        console.log('Navigation submit button configured');
    }
    
    console.log('Review page setup complete');
}

function saveFormData() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.name) {
            formData[input.name] = input.value;
        }
    });
    
    // Save to localStorage
    localStorage.setItem('wareWorksFormData', JSON.stringify(formData));
}

function restoreFormData() {
    const saved = localStorage.getItem('wareWorksFormData');
    if (saved) {
        formData = JSON.parse(saved);
        
        // Restore values to current page inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.name && formData[input.name]) {
                input.value = formData[input.name];
            }
        });
    }
}

function nextPage() {
    console.log('Next page clicked');
    
    if (currentPage < totalPages) {
        // Check if required fields are filled
        if (checkRequiredFields()) {
            // Save current page data before moving
            saveFormData();
            loadPage(currentPage + 1);
        } else {
            showMessage('Please fill in all required fields before continuing.', 'error');
        }
    } else {
        // On last page, submit the form
        submitApplication();
    }
}

function checkRequiredFields() {
    const requiredFields = document.querySelectorAll('#pageContentContainer input[required], #pageContentContainer select[required], #pageContentContainer textarea[required]');
    
    for (let field of requiredFields) {
        const value = field.value.trim();
        if (!value) {
            // Highlight empty required field
            field.style.borderColor = '#dc3545';
            field.focus();
            console.log('Required field empty:', field.name || field.id);
            return false;
        } else {
            // Remove error styling
            field.style.borderColor = '';
        }
    }
    
    return true;
}

function validateCurrentPage() {
    const requiredFields = document.querySelectorAll('#pageContentContainer input[required], #pageContentContainer select[required], #pageContentContainer textarea[required]');
    let isValid = true;
    let invalidFields = [];
    
    requiredFields.forEach(field => {
        const value = field.value.trim();
        let fieldValid = true;
        let errorReason = '';
        
        // Remove any existing error styling
        field.style.borderColor = '';
        
        if (!value) {
            fieldValid = false;
            errorReason = 'empty';
        } else if (field.type === 'tel') {
            // Validate phone number has 10 digits
            const digits = value.replace(/\D/g, '');
            if (digits.length !== 10) {
                fieldValid = false;
                errorReason = `phone: ${digits.length} digits (need 10)`;
            }
        } else if (field.id === 'socialSecurityNumber') {
            // Validate SSN has 9 digits
            const digits = value.replace(/\D/g, '');
            if (digits.length !== 9) {
                fieldValid = false;
                errorReason = `ssn: ${digits.length} digits (need 9)`;
            }
        } else if (field.type === 'email') {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                fieldValid = false;
                errorReason = 'invalid email format';
            }
        }
        
        if (!fieldValid) {
            field.style.borderColor = '#dc3545';
            isValid = false;
            invalidFields.push({
                id: field.id || field.name,
                name: field.getAttribute('data-name') || field.name,
                reason: errorReason,
                value: value
            });
        } else {
            // Add green border for valid fields
            field.style.borderColor = '#28a745';
        }
    });
    
    console.log('Page validation result:', isValid);
    if (!isValid) {
        console.log('Invalid fields:', invalidFields);
    }
    return isValid;
}

async function submitApplication() {
    console.log('Submitting application...');
    
    try {
        // Show loading
        showLoading(true);
        showMessage('Uploading documents...', 'info');
        
        // Save all form data
        saveFormData();
        
        // Generate submission ID
        const submissionId = generateSubmissionId();
        
        // Step 1: Upload documents to Netlify Blobs
        let documentUploadResults = null;
        if (window.uploadedDocuments && Object.keys(window.uploadedDocuments).length > 0) {
            documentUploadResults = await uploadDocuments(submissionId);
            showMessage('Processing application...', 'info');
        }
        
        // Step 2: Prepare submission data with document URLs
        const submitData = {
            ...formData, // Spread the form data directly into the object
            documents: documentUploadResults ? formatDocumentsForSubmission(documentUploadResults) : null,
            language: 'en', // You can track this from disclaimer selection
            submissionTime: new Date().toISOString(),
            sessionId: 'sess_' + Date.now(),
            submissionId: submissionId
        };
        
        showMessage('Submitting your application...', 'info');
        
        // Step 3: Submit application to main function
        const response = await fetch('https://wareworks-backend.netlify.app/.netlify/functions/submit-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submitData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showSubmissionSuccess(result);
        } else {
            throw new Error(`Submission failed: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        showMessage('Error submitting application. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Generate unique submission ID
 */
function generateSubmissionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `WW_${timestamp}_${random}`;
}

/**
 * Upload documents to Netlify Blobs
 */
async function uploadDocuments(submissionId) {
    if (!window.uploadedDocuments || Object.keys(window.uploadedDocuments).length === 0) {
        return null;
    }
    
    // Convert files to base64 format for upload
    const documents = {};
    
    // Process identification document
    if (window.uploadedDocuments.idDocument) {
        documents.identification = await fileToDocumentObject(window.uploadedDocuments.idDocument);
    }
    
    // Process resume (optional)
    if (window.uploadedDocuments.resumeDocument) {
        documents.resume = await fileToDocumentObject(window.uploadedDocuments.resumeDocument);
    }
    
    // Process certifications
    if (window.uploadedDocuments.certificationDocuments && window.uploadedDocuments.certificationDocuments.length > 0) {
        documents.certifications = [];
        for (const cert of window.uploadedDocuments.certificationDocuments) {
            const certDoc = await fileToDocumentObject(cert);
            documents.certifications.push(certDoc);
        }
    }
    
    // Upload to Netlify Blobs
    const uploadResponse = await fetch('https://wareworks-backend.netlify.app/.netlify/functions/upload-documents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            submissionId: submissionId,
            documents: documents
        })
    });
    
    if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(`Document upload failed: ${error.error || uploadResponse.status}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('Document upload successful:', uploadResult);
    return uploadResult.uploadedFiles;
}

/**
 * Convert File object to document object with base64 data
 */
async function fileToDocumentObject(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result.split(',')[1]; // Remove data:mime;base64, prefix
            resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                data: base64Data
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Format uploaded document results for submission
 */
function formatDocumentsForSubmission(uploadResults) {
    const formatted = {};
    
    if (uploadResults.identification) {
        formatted.identification = {
            blobUrl: uploadResults.identification.blobUrl,
            originalName: uploadResults.identification.originalName,
            mimeType: uploadResults.identification.mimeType,
            size: uploadResults.identification.size,
            documentId: uploadResults.identification.documentId
        };
    }
    
    if (uploadResults.resume) {
        formatted.resume = {
            blobUrl: uploadResults.resume.blobUrl,
            originalName: uploadResults.resume.originalName,
            mimeType: uploadResults.resume.mimeType,
            size: uploadResults.resume.size,
            documentId: uploadResults.resume.documentId
        };
    }
    
    if (uploadResults.certifications && uploadResults.certifications.length > 0) {
        formatted.certifications = uploadResults.certifications.map(cert => ({
            blobUrl: cert.blobUrl,
            originalName: cert.originalName,
            mimeType: cert.mimeType,
            size: cert.size,
            documentId: cert.documentId
        }));
    }
    
    return formatted;
}

function showSubmissionSuccess(result) {
    // Hide form
    const mainContainer = document.getElementById('mainFormContainer');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }
    
    // Show success message
    const wareWorksForm = document.getElementById('wareWorksForm');
    if (wareWorksForm) {
        const successHtml = `
            <div style="background: white; border-radius: 12px; padding: 60px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <div style="font-size: 80px; margin-bottom: 30px;">✅</div>
                <h2 style="color: #28a745; margin-bottom: 20px; font-family: 'Bricolage Grotesque', sans-serif; font-size: 32px;">Application Submitted Successfully!</h2>
                <p style="color: #666; margin-bottom: 30px; font-size: 18px; line-height: 1.6;">
                    Thank you for your interest in WareWorks. We've received your application and will review it within 5-7 business days.
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <p style="margin: 0; font-size: 16px; color: #666;">
                        <strong>Confirmation ID:</strong> ${result.id || 'WW-' + Date.now()}<br>
                        <strong>Submitted:</strong> ${new Date().toLocaleString()}
                    </p>
                </div>
                <p style="font-size: 14px; color: #666;">Please save this confirmation ID for your records.</p>
            </div>
        `;
        wareWorksForm.innerHTML = successHtml;
    }
    
    // Clear saved form data
    localStorage.removeItem('wareWorksFormData');
}

function previousPage() {
    console.log('Previous page clicked');
    if (currentPage > 1) {
        loadPage(currentPage - 1);
    }
}

function updateProgress() {
    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const percentage = (currentPage / totalPages) * 100;
        progressFill.style.width = percentage + '%';
    }
    
    // Update step indicators
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
    
    // Update page indicator
    const pageIndicator = document.getElementById('pageIndicator');
    if (pageIndicator) {
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

function updateButtons() {
    const prevBtn = document.getElementById('prevButton');
    const nextBtn = document.getElementById('nextButton');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = previousPage;
    }
    
    if (nextBtn) {
        nextBtn.onclick = nextPage;
        if (currentPage === totalPages) {
            nextBtn.textContent = 'Submit Application';
            nextBtn.style.background = 'linear-gradient(135deg, #131f5b 0%, #1e308e 100%)';
            nextBtn.style.color = 'white';
            nextBtn.style.fontWeight = '600';
        } else {
            nextBtn.textContent = 'Next';
            nextBtn.style.background = '';
            nextBtn.style.color = '';
            nextBtn.style.fontWeight = '';
        }
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message visible ${type}`;
        statusMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
    console.log(`${type.toUpperCase()}: ${message}`);
}

console.log('Simple form script loaded');