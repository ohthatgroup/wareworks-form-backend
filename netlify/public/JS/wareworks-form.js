// WareWorks Application Form - Enhanced JavaScript
// Version 4.0 - Complete Redesign with Modern UI and Enhanced UX
// Compatible with Wareworks.me Design System

// Configuration URLs
const CONFIG = {
    NETLIFY_SUBMIT_URL: 'https://wareworks-backend.netlify.app/.netlify/functions/submit-application',
    NETLIFY_CONFIG_URL: 'https://wareworks-backend.netlify.app/.netlify/functions/get-config',
    TRANSLATION_SHEET_URL: 'https://docs.google.com/spreadsheets/d/1jgMtCCuntq8nA_zQTz8QWSnRd4YjevjXW2sPPQUwIy4/export?format=csv&gid=0',
    
    // URLs for hosted HTML page fragments on Netlify
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

    // Server-side Google Places Autocomplete endpoint
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
    }
};

// Global Application State
class WareWorksApplication {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.secureConfig = {};
        this.currentPage = 1;
        this.totalPages = 8;
        this.formDataStore = {};
        this.uploadedDocuments = {
            identification: null,
            resume: null,
            certifications: []
        };
        this.auditLog = new AuditLogger();
        this.validationErrors = new Map();
        this.isSubmitting = false;
        
        // Bind methods
        this.nextPage = this.nextPage.bind(this);
        this.previousPage = this.previousPage.bind(this);
        this.acceptDisclaimer = this.acceptDisclaimer.bind(this);
    }

    async initialize() {
        try {
            this.showLoading(true);
            this.auditLog.log('app_initialization_started');
            
            // Load configuration and translations in parallel
            await Promise.allSettled([
                this.loadSecureConfiguration(),
                this.loadTranslations()
            ]);
            
            // Setup initial UI
            this.setupMainEventListeners();
            this.setupLanguageSelector();
            this.initializeAutoSave();
            
            this.auditLog.log('app_initialization_completed');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.auditLog.log('app_initialization_error', { error: error.message });
            this.handleInitializationError(error);
        } finally {
            this.showLoading(false);
        }
    }

    handleInitializationError(error) {
        // Use fallback configurations
        if (!this.secureConfig || Object.keys(this.secureConfig).length === 0) {
            this.secureConfig = { ...CONFIG.FALLBACK_CONFIG };
        }
        if (!this.translations || Object.keys(this.translations).length === 0) {
            this.createFallbackTranslations();
        }
        
        this.showMessage('Application loaded with limited functionality. Some features may not work.', 'warning');
    }

    // Language and Disclaimer Management
    acceptDisclaimer(language) {
        this.currentLanguage = language;
        
        // Hide disclaimer and show main container
        const disclaimer = document.getElementById('languageDisclaimer');
        const mainContainer = document.getElementById('mainFormContainer');
        
        if (disclaimer) disclaimer.style.display = 'none';
        if (mainContainer) mainContainer.style.display = 'block';
        
        // Update language selector UI
        document.querySelectorAll('.lang-button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === language);
        });
        
        // Apply translations and load first page
        this.applyTranslations(this.currentLanguage);
        this.auditLog.log('disclaimer_accepted', { language: language });
        this.showPage(this.currentPage);
    }

    setupLanguageSelector() {
        const langButtons = document.querySelectorAll('.lang-button');
        
        langButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const newLanguage = button.getAttribute('data-lang');
                
                if (newLanguage !== this.currentLanguage) {
                    this.switchLanguage(newLanguage);
                }
            });
        });
    }

    switchLanguage(newLanguage) {
        const previousLanguage = this.currentLanguage;
        this.currentLanguage = newLanguage;
        
        // Update UI
        document.querySelectorAll('.lang-button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === newLanguage);
        });
        
        this.applyTranslations(this.currentLanguage);
        this.auditLog.log('language_changed', { 
            previousLanguage, 
            newLanguage 
        });
    }

    // Page Navigation
    async nextPage() {
        if (this.isSubmitting) return;
        
        // Save current page data
        this.saveFormData(this.currentPage);

        if (this.currentPage < this.totalPages) {
            if (await this.validateCurrentPage()) {
                if (this.currentPage === this.totalPages - 1) {
                    // Load and populate review page
                    await this.loadPageContent(this.totalPages);
                    this.generateReview();
                }
                this.currentPage++;
                await this.showPage(this.currentPage);
                this.updateProgress();
                this.auditLog.log('page_navigation', { action: 'next', page: this.currentPage });
            }
        } else {
            await this.handleFormSubmit();
        }
    }

    async previousPage() {
        if (this.isSubmitting) return;
        
        // Save current page data
        this.saveFormData(this.currentPage);

        if (this.currentPage > 1) {
            this.currentPage--;
            await this.showPage(this.currentPage);
            this.updateProgress();
            this.auditLog.log('page_navigation', { action: 'previous', page: this.currentPage });
        }
    }

    async showPage(pageNum) {
        try {
            // Load page content if not already loaded
            await this.loadPageContent(pageNum);

            // Hide all pages and show active one
            document.querySelectorAll('.form-page').forEach(page => {
                page.classList.remove('active');
                page.style.display = 'none';
            });
            
            const targetPage = document.getElementById(`page${pageNum}`);
            if (targetPage) {
                targetPage.classList.add('active');
                targetPage.style.display = 'block';
                
                // Initialize page-specific functionality
                this.initializePageElements(pageNum);
            }
            
            this.updateNavigationButtons();
            this.updateStepIndicators();
            this.updatePageIndicator();
            
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error(`Error showing page ${pageNum}:`, error);
            this.showMessage('Error loading page. Please try again.', 'error');
        }
    }

    async loadPageContent(pageNum) {
        const pageUrl = CONFIG.PAGE_URLS[pageNum];
        if (!pageUrl) {
            throw new Error(`No URL found for page ${pageNum}`);
        }

        // Check if page is already loaded
        const existingPage = document.getElementById(`page${pageNum}`);
        if (existingPage && existingPage.dataset.loaded === 'true') {
            return;
        }

        try {
            this.showLoading(true);
            this.auditLog.log('page_content_load_started', { page: pageNum, url: pageUrl });
            
            const response = await fetch(pageUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const htmlContent = await response.text();
            
            // Create or update page container
            let pageContainer = document.getElementById(`page${pageNum}`);
            if (!pageContainer) {
                pageContainer = document.createElement('div');
                pageContainer.id = `page${pageNum}`;
                pageContainer.className = 'form-page';
                pageContainer.style.display = 'none';
                
                const mainContainer = document.getElementById('pageContentContainer') || 
                                    document.getElementById('mainFormContainer');
                if (mainContainer) {
                    mainContainer.appendChild(pageContainer);
                }
            }
            
            pageContainer.innerHTML = htmlContent;
            pageContainer.dataset.loaded = 'true';
            
            this.auditLog.log('page_content_load_success', { page: pageNum });
            
        } catch (error) {
            console.error(`Failed to load content for page ${pageNum}:`, error);
            this.auditLog.log('page_content_load_error', { page: pageNum, error: error.message });
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    initializePageElements(pageNum) {
        // Restore form data for this page
        this.restoreFormData(pageNum);
        
        // Apply translations
        this.applyTranslations(this.currentLanguage);
        
        // Initialize page-specific functionality
        switch (pageNum) {
            case 1:
                this.setupAddressAutocomplete();
                this.setupInputFormatters();
                break;
            case 2:
                this.setupInputFormatters();
                break;
            case 3:
                this.setupConditionalFields();
                break;
            case 4:
                this.setupFileUploads();
                break;
            case 5:
                this.setupApplicationQuestions();
                break;
            case 6:
                this.setupEducationSection();
                break;
            case 7:
                this.setupEmploymentSection();
                break;
            case 8:
                this.setupReviewPage();
                break;
        }
        
        // General field validation setup
        this.setupFieldValidation();
        
        this.auditLog.log('page_elements_initialized', { page: pageNum });
    }

    // Form Validation
    async validateCurrentPage() {
        const currentPageElement = document.getElementById(`page${this.currentPage}`);
        if (!currentPageElement) return true;
        
        let isValid = true;
        this.validationErrors.clear();
        
        // Validate required fields
        const requiredFields = currentPageElement.querySelectorAll('[required]');
        for (const field of requiredFields) {
            if (!this.validateField(field)) {
                isValid = false;
            }
        }
        
        // Page-specific validation
        const pageValidation = await this.validatePageSpecific(this.currentPage);
        if (!pageValidation) {
            isValid = false;
        }
        
        // Show summary of errors if any
        if (!isValid) {
            this.showValidationErrors();
        }
        
        return isValid;
    }

    validateField(field) {
        const fieldId = field.id;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field check
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = this.getTranslation('field_required') || 'This field is required.';
        }
        // Email validation
        else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            errorMessage = this.getTranslation('invalid_email') || 'Invalid email format.';
        }
        // SSN validation
        else if (fieldId === 'socialSecurityNumber' && value && !/^\d{3}-\d{2}-\d{4}$/.test(value)) {
            isValid = false;
            errorMessage = this.getTranslation('invalid_ssn') || 'Invalid SSN format (XXX-XX-XXXX).';
        }
        // Phone validation
        else if (field.type === 'tel' && value && !/^\(\d{3}\) \d{3}-\d{4}$/.test(value)) {
            isValid = false;
            errorMessage = this.getTranslation('invalid_phone') || 'Invalid phone format.';
        }
        // ZIP code validation
        else if (fieldId === 'zipCode' && value && !/^\d{5}(-\d{4})?$/.test(value)) {
            isValid = false;
            errorMessage = this.getTranslation('invalid_zip') || 'Invalid ZIP code format.';
        }

        // Update field UI
        this.updateFieldValidationUI(field, isValid, errorMessage);
        
        if (!isValid) {
            this.validationErrors.set(fieldId, errorMessage);
        }
        
        return isValid;
    }

    async validatePageSpecific(pageNum) {
        switch (pageNum) {
            case 4: // Documents page
                return this.validateDocuments();
            case 6: // Education page
                return this.validateEducationEntries();
            case 7: // Employment page
                return this.validateEmploymentEntries();
            default:
                return true;
        }
    }

    validateDocuments() {
        let isValid = true;
        
        // Check required documents
        if (!this.uploadedDocuments.identification) {
            this.showMessage('Please upload a government-issued photo ID.', 'error');
            isValid = false;
        }
        
        if (!this.uploadedDocuments.certifications || this.uploadedDocuments.certifications.length === 0) {
            this.showMessage('Please upload at least one certification or license document.', 'error');
            isValid = false;
        }
        
        return isValid;
    }

    // Form Data Management
    saveFormData(pageNum) {
        const form = document.getElementById('applicationForm') || document;
        const inputs = form.querySelectorAll(`#page${pageNum} input, #page${pageNum} select, #page${pageNum} textarea`);
        
        inputs.forEach(input => {
            const name = input.name;
            if (!name) return;

            if (input.type === 'radio') {
                if (input.checked) {
                    this.formDataStore[name] = input.value;
                }
            } else if (input.type === 'checkbox') {
                if (!this.formDataStore[name]) this.formDataStore[name] = [];
                if (input.checked) {
                    this.formDataStore[name].push(input.value);
                }
            } else if (name.includes('[') && name.includes(']')) {
                // Handle array inputs like education[0][schoolName]
                this.saveArrayField(name, input.value);
            } else {
                this.formDataStore[name] = input.value;
            }
        });

        // Clean up empty array entries
        this.cleanupArrayFields();
        
        // Auto-save to localStorage as backup
        this.autoSave();
        
        this.auditLog.log('form_data_saved', { 
            page: pageNum, 
            fieldCount: Object.keys(this.formDataStore).length 
        });
    }

    saveArrayField(name, value) {
        const match = name.match(/(\w+)\[(\d+)\]\[(\w+)\]/);
        if (match) {
            const [, section, index, field] = match;
            if (!this.formDataStore[section]) this.formDataStore[section] = [];
            if (!this.formDataStore[section][index]) this.formDataStore[section][index] = {};
            this.formDataStore[section][index][field] = value;
        }
    }

    cleanupArrayFields() {
        ['education', 'employment'].forEach(section => {
            if (this.formDataStore[section]) {
                this.formDataStore[section] = this.formDataStore[section].filter(entry => 
                    entry && Object.values(entry).some(val => val && val.trim() !== '')
                );
            }
        });
    }

    restoreFormData(pageNum) {
        const form = document.getElementById('applicationForm') || document;
        const inputs = form.querySelectorAll(`#page${pageNum} input, #page${pageNum} select, #page${pageNum} textarea`);
        
        inputs.forEach(input => {
            const name = input.name;
            if (!name) return;

            if (input.type === 'radio') {
                if (this.formDataStore[name] === input.value) {
                    input.checked = true;
                    // Trigger any change handlers
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else if (input.type === 'checkbox') {
                const values = this.formDataStore[name] || [];
                input.checked = values.includes(input.value);
            } else if (name.includes('[') && name.includes(']')) {
                const value = this.getArrayFieldValue(name);
                if (value !== undefined) {
                    input.value = value;
                }
            } else if (this.formDataStore[name] !== undefined) {
                input.value = this.formDataStore[name];
            }
        });

        this.auditLog.log('form_data_restored', { page: pageNum });
    }

    getArrayFieldValue(name) {
        const match = name.match(/(\w+)\[(\d+)\]\[(\w+)\]/);
        if (match) {
            const [, section, index, field] = match;
            return this.formDataStore[section]?.[index]?.[field];
        }
        return undefined;
    }

    // Auto-save functionality
    initializeAutoSave() {
        // Load saved data from localStorage
        this.loadAutoSavedData();
        
        // Set up periodic auto-save
        setInterval(() => {
            this.autoSave();
        }, 30000); // Save every 30 seconds
    }

    autoSave() {
        try {
            const saveData = {
                formData: this.formDataStore,
                currentPage: this.currentPage,
                uploadedDocuments: this.serializeDocuments(),
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('wareworks_autosave', JSON.stringify(saveData));
            this.auditLog.log('auto_save_completed');
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    loadAutoSavedData() {
        try {
            const saved = localStorage.getItem('wareworks_autosave');
            if (saved) {
                const saveData = JSON.parse(saved);
                
                // Check if save is recent (within 24 hours)
                const saveTime = new Date(saveData.timestamp);
                const now = new Date();
                const hoursDiff = (now - saveTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.formDataStore = saveData.formData || {};
                    // Note: Don't restore documents automatically for security
                    this.auditLog.log('auto_save_restored', { age_hours: hoursDiff });
                    
                    // Offer to restore to user
                    this.offerRestoreOption(saveData);
                }
            }
        } catch (error) {
            console.warn('Auto-save restore failed:', error);
        }
    }

    // File Upload Management
    setupFileUploads() {
        this.setupSingleFileUpload('idDocument', 'identification');
        this.setupSingleFileUpload('resumeDocument', 'resume');
        this.setupMultiFileUpload('certificationDocuments', 'certifications');
    }

    setupSingleFileUpload(inputId, documentType) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const uploadArea = input.closest('.file-upload-container')?.querySelector('.file-upload-area');
        const preview = document.getElementById(inputId + 'Preview');
        
        if (!uploadArea || !preview) return;

        // Remove existing event listeners by cloning
        const newInput = input.cloneNode(true);
        const newUploadArea = uploadArea.cloneNode(true);
        
        input.parentNode.replaceChild(newInput, input);
        uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);

        // Set up event listeners
        newInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, documentType, preview, false);
        });

        newUploadArea.onclick = () => newInput.click();
        this.setupDragAndDrop(newUploadArea, documentType, preview, false);
        
        // Update preview with existing files
        this.updateFilePreview(documentType, preview);
    }

    setupMultiFileUpload(inputId, documentType) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const uploadArea = input.closest('.file-upload-container')?.querySelector('.file-upload-area');
        const preview = document.getElementById(inputId + 'Preview');
        
        if (!uploadArea || !preview) return;

        // Remove existing event listeners by cloning
        const newInput = input.cloneNode(true);
        const newUploadArea = uploadArea.cloneNode(true);
        
        input.parentNode.replaceChild(newInput, input);
        uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);

        // Set up event listeners
        newInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, documentType, preview, true);
        });

        newUploadArea.onclick = () => newInput.click();
        this.setupDragAndDrop(newUploadArea, documentType, preview, true);
        
        // Update preview with existing files
        this.updateFilePreview(documentType, preview);
    }

    setupDragAndDrop(uploadArea, documentType, preview, isMultiple) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelection(e.dataTransfer.files, documentType, preview, isMultiple);
        });
    }

    async handleFileSelection(files, documentType, preview, isMultiple) {
        if (!files || files.length === 0) return;

        const validFiles = [];
        const errors = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const validation = this.validateFile(file, documentType);

            if (validation.isValid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }

        if (errors.length > 0) {
            this.showMessage('File validation errors: ' + errors.join(', '), 'error');
            return;
        }

        // Store files
        if (isMultiple) {
            if (!this.uploadedDocuments[documentType]) {
                this.uploadedDocuments[documentType] = [];
            }
            this.uploadedDocuments[documentType].push(...validFiles);
        } else {
            this.uploadedDocuments[documentType] = validFiles[0];
        }

        this.updateFilePreview(documentType, preview);
        this.auditLog.log('files_selected', {
            documentType,
            fileCount: validFiles.length,
            fileNames: validFiles.map(f => f.name)
        });
    }

    validateFile(file, documentType) {
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (file.size > maxSize) {
            return { isValid: false, error: 'File size exceeds 10MB limit' };
        }

        const allowedTypes = {
            identification: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
            resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            certifications: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
        };

        if (!allowedTypes[documentType].includes(file.type)) {
            return { isValid: false, error: 'Invalid file type' };
        }

        return { isValid: true };
    }

    // Address Autocomplete
    setupAddressAutocomplete() {
        const input = document.getElementById('streetAddress');
        if (!input) return;

        let autocompleteTimer;
        
        input.addEventListener('input', (e) => {
            clearTimeout(autocompleteTimer);
            const query = e.target.value;
            
            if (query.length < 3) {
                this.clearAddressSuggestions();
                return;
            }
            
            autocompleteTimer = setTimeout(() => {
                this.fetchAddressSuggestions(query);
            }, 300);
        });
    }

    async fetchAddressSuggestions(query) {
        try {
            this.auditLog.log('autocomplete_request_sent', { query });
            
            const response = await fetch(`${CONFIG.AUTOCOMPLETE_API_URL}?input=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayAddressSuggestions(data.predictions || []);
            
            this.auditLog.log('autocomplete_suggestions_received', { 
                count: data.predictions?.length || 0 
            });
            
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
            this.auditLog.log('autocomplete_fetch_error', { error: error.message });
        }
    }

    displayAddressSuggestions(predictions) {
        // Implementation would create a dropdown with suggestions
        // For now, we'll use a simple datalist approach
        let dataList = document.getElementById('addressSuggestions');
        if (!dataList) {
            dataList = document.createElement('datalist');
            dataList.id = 'addressSuggestions';
            document.body.appendChild(dataList);
            document.getElementById('streetAddress').setAttribute('list', 'addressSuggestions');
        }

        dataList.innerHTML = '';
        predictions.forEach(prediction => {
            const option = document.createElement('option');
            option.value = prediction.description;
            option.dataset.placeId = prediction.place_id;
            dataList.appendChild(option);
        });
    }

    // Form Submission
    async handleFormSubmit() {
        if (this.isSubmitting) return;

        try {
            this.isSubmitting = true;
            this.updateSubmitButton(true);
            this.auditLog.log('form_submission_started');

            // Final validation
            if (!(await this.validateCurrentPage())) {
                throw new Error('Validation failed');
            }

            // Collect all form data
            this.saveFormData(this.currentPage);
            const finalFormData = { ...this.formDataStore };

            // Prepare documents for submission
            finalFormData.documents = await this.prepareDocumentsForSubmission();
            finalFormData.auditLog = this.auditLog.getLog();
            finalFormData.language = this.currentLanguage;
            finalFormData.submissionTime = new Date().toISOString();
            finalFormData.sessionId = this.auditLog.sessionId;

            // Submit to server
            const response = await this.submitToNetlify(finalFormData);

            if (response.success) {
                this.auditLog.log('form_submission_success', { responseId: response.id });
                this.showSubmissionSuccess(response);
                this.clearAutoSavedData();
            } else {
                throw new Error(response.error || 'Submission failed');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            this.auditLog.log('form_submission_error', { error: error.message });
            this.showMessage(`Error submitting application: ${error.message}`, 'error');
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton(false);
        }
    }

    async prepareDocumentsForSubmission() {
        const documents = {
            identification: null,
            resume: null,
            certifications: []
        };

        if (this.uploadedDocuments.identification) {
            documents.identification = {
                name: this.uploadedDocuments.identification.name,
                size: this.uploadedDocuments.identification.size,
                type: this.uploadedDocuments.identification.type,
                data: await this.readFileAsBase64(this.uploadedDocuments.identification)
            };
        }

        if (this.uploadedDocuments.resume) {
            documents.resume = {
                name: this.uploadedDocuments.resume.name,
                size: this.uploadedDocuments.resume.size,
                type: this.uploadedDocuments.resume.type,
                data: await this.readFileAsBase64(this.uploadedDocuments.resume)
            };
        }

        for (const file of this.uploadedDocuments.certifications) {
            documents.certifications.push({
                name: file.name,
                size: file.size,
                type: file.type,
                data: await this.readFileAsBase64(file)
            });
        }

        return documents;
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    async submitToNetlify(data) {
        const submitUrl = this.secureConfig.SUBMIT_URL || CONFIG.NETLIFY_SUBMIT_URL;

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

    // Configuration and Translation Management
    async loadSecureConfiguration() {
        try {
            this.auditLog.log('config_load_started');

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
                this.secureConfig = await response.json();
                this.auditLog.log('config_load_success', { source: 'netlify_function' });
            } else {
                throw new Error(`Config server responded with ${response.status}`);
            }

        } catch (error) {
            console.warn('Secure config load failed, using fallback:', error.message);
            this.auditLog.log('config_load_fallback', { error: error.message });
            this.secureConfig = { ...CONFIG.FALLBACK_CONFIG };
        }
    }

    async loadTranslations() {
        try {
            this.auditLog.log('translations_load_started');

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
            this.parseTranslations(csvText);

            this.auditLog.log('translations_load_success', {
                totalTranslations: Object.keys(this.translations.en || {}).length
            });

        } catch (error) {
            console.warn('Translation loading failed:', error.message);
            this.auditLog.log('translations_load_error', { error: error.message });
            this.createFallbackTranslations();
        }
    }

    parseTranslations(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        this.translations = { en: {}, es: {} };

        for (let i = 1; i < lines.length; i++) {
            const row = this.parseCSVRow(lines[i]);
            if (row.length >= 3 && row[0]) {
                const fieldKey = row[0];
                this.translations.en[fieldKey] = row[1] || fieldKey;
                this.translations.es[fieldKey] = row[2] || row[1] || fieldKey;
            }
        }
    }

    parseCSVRow(row) {
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

    applyTranslations(language) {
        if (!this.translations[language]) {
            console.warn(`No translations available for language: ${language}`);
            return;
        }

        const elementsToTranslate = document.querySelectorAll('[data-translate]');

        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translations[language][key];

            if (translation) {
                if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                    element.value = translation;
                } else if (element.placeholder !== undefined && element.getAttribute('data-translate-placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        this.updatePageIndicator();
        this.auditLog.log('translations_applied', { language: language });
    }

    getTranslation(key, fallback = '') {
        return this.translations[this.currentLanguage]?.[key] || fallback;
    }

    createFallbackTranslations() {
        this.translations = {
            en: {
                'step_personal': 'Personal Info',
                'step_contact': 'Contact',
                'step_status': 'Status',
                'step_documents': 'Documents',
                'step_application': 'Application',
                'step_education': 'Education',
                'step_employment': 'Employment',
                'step_review': 'Review',
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
                'invalid_phone': 'Invalid phone format.',
                'invalid_zip': 'Invalid ZIP code format.'
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
                'invalid_phone': 'Formato de teléfono inválido.',
                'invalid_zip': 'Formato de código postal inválido.'
            }
        };
    }

    // UI Helper Methods
    setupMainEventListeners() {
        // Navigation buttons
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');

        if (prevButton) prevButton.addEventListener('click', this.previousPage);
        if (nextButton) nextButton.addEventListener('click', this.nextPage);

        // Form submission prevention
        const form = document.getElementById('applicationForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                return false;
            });
        }

        // General input change listener
        document.addEventListener('input', (e) => {
            if (e.target.closest('.form-page')) {
                if (e.target.hasAttribute('required')) {
                    this.validateField(e.target);
                }
                this.auditLog.log('field_changed', {
                    fieldName: e.target.name || e.target.id,
                    fieldType: e.target.type || e.target.tagName.toLowerCase(),
                    page: this.currentPage
                });
            }
        });

        // Prevent data loss on page reload
        window.addEventListener('beforeunload', (e) => {
            if (Object.keys(this.formDataStore).length > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    updateNavigationButtons() {
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');

        if (prevButton) {
            prevButton.disabled = this.currentPage === 1 || this.isSubmitting;
        }

        if (nextButton) {
            nextButton.disabled = this.isSubmitting;
            if (this.currentPage === this.totalPages) {
                nextButton.textContent = this.getTranslation('submit_application', 'Submit Application');
            } else {
                nextButton.textContent = this.getTranslation('next', 'Next');
            }
        }
    }

    updateSubmitButton(isSubmitting) {
        const nextButton = document.getElementById('nextButton');
        if (nextButton && this.currentPage === this.totalPages) {
            if (isSubmitting) {
                nextButton.textContent = this.getTranslation('submitting', 'Submitting...');
                nextButton.disabled = true;
            } else {
                nextButton.textContent = this.getTranslation('submit_application', 'Submit Application');
                nextButton.disabled = false;
            }
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            const percentage = (this.currentPage / this.totalPages) * 100;
            progressFill.style.width = percentage + '%';
        }
    }

    updateStepIndicators() {
        for (let i = 1; i <= this.totalPages; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                step.classList.remove('active', 'completed');

                if (i < this.currentPage) {
                    step.classList.add('completed');
                } else if (i === this.currentPage) {
                    step.classList.add('active');
                }
            }
        }
    }

    updatePageIndicator() {
        const pageIndicator = document.getElementById('pageIndicator');
        if (pageIndicator) {
            const pageText = this.getTranslation('page_indicator', 'Page {current} of {total}');
            pageIndicator.textContent = pageText
                .replace('{current}', this.currentPage)
                .replace('{total}', this.totalPages);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showMessage(message, type = 'info') {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message visible ${type}`;

            // Auto-hide after 5 seconds
            setTimeout(() => {
                statusMessage.className = 'status-message';
            }, 5000);
        }

        // Also log to console for debugging
        console[type === 'error' ? 'error' : 'info']('Message:', message);
    }

    showSubmissionSuccess(response) {
        // Hide form and navigation
        const form = document.getElementById('applicationForm');
        const navigation = document.querySelector('.form-navigation');
        const progress = document.querySelector('.progress-container');

        if (form) form.style.display = 'none';
        if (navigation) navigation.style.display = 'none';
        if (progress) progress.style.display = 'none';

        // Show success message
        const successMessage = this.getTranslation('submission_success', 'Application submitted successfully!');
        this.showMessage(successMessage, 'success');

        // Create success page content
        const container = document.getElementById('mainFormContainer') || document.body;
        const successDiv = document.createElement('div');
        successDiv.className = 'submission-success';
        successDiv.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: #fff; border-radius: 0.75rem; box-shadow: 0 4px 20px rgba(19, 31, 91, 0.08);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                <h2 style="color: #28a745; margin-bottom: 1rem; font-family: 'Bricolage Grotesque', sans-serif;">Application Submitted Successfully!</h2>
                <p style="color: #666; margin-bottom: 2rem; font-size: 1.1rem;">Thank you for your interest in WareWorks. We've received your application and will review it within 5-7 business days.</p>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <p style="margin: 0; font-size: 0.9rem; color: #666;">
                        <strong>Confirmation ID:</strong> ${response.id}<br>
                        <strong>Submitted:</strong> ${new Date().toLocaleString()}
                    </p>
                </div>
                <p style="font-size: 0.9rem; color: #666;">Please save this confirmation ID for your records.</p>
            </div>
        `;
        container.appendChild(successDiv);
    }

    clearAutoSavedData() {
        try {
            localStorage.removeItem('wareworks_autosave');
            this.auditLog.log('auto_save_cleared');
        } catch (error) {
            console.warn('Failed to clear auto-saved data:', error);
        }
    }
}

// Audit Logger Class
class AuditLogger {
    constructor() {
        this.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.startTime = new Date().toISOString();
        this.actions = [];
    }

    log(action, details = {}) {
        this.actions.push({
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            userAgent: navigator.userAgent,
            sessionId: this.sessionId
        });

        // Debug logging if enabled
        if (window.debugMode) {
            console.log('Audit:', action, details);
        }
    }

    getLog() {
        return {
            sessionId: this.sessionId,
            startTime: this.startTime,
            actions: this.actions
        };
    }
}

// Global Application Instance
let wareWorksApp;

// Initialize Application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        wareWorksApp = new WareWorksApplication();
        await wareWorksApp.initialize();

        // Make certain functions globally available for HTML onclick handlers
        window.acceptDisclaimer = wareWorksApp.acceptDisclaimer;
        window.nextPage = wareWorksApp.nextPage;
        window.previousPage = wareWorksApp.previousPage;

    } catch (error) {
        console.error('Failed to initialize WareWorks application:', error);
        
        // Show fallback error message
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; font-family: Arial, sans-serif;">
                <h1 style="color: #dc3545;">Application Error</h1>
                <p>Sorry, there was an error loading the application. Please refresh the page and try again.</p>
                <p style="font-size: 0.9rem; color: #666;">Error: ${error.message}</p>
            </div>
        `;
    }
});

// Security: Clear sensitive data on page unload
window.addEventListener('beforeunload', function() {
    if (wareWorksApp) {
        wareWorksApp.auditLog.log('page_unload');
        
        // Clear sensitive fields
        const sensitiveFields = ['socialSecurityNumber', 'uscisANumber', 'alienDocumentNumber'];
        sensitiveFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
    }
});