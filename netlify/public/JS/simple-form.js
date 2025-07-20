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
    
    // Load first page
    loadPage(1);
}

async function loadPage(pageNum) {
    console.log('Loading page:', pageNum);
    
    try {
        // Show loading
        showLoading(true);
        
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
    } else if (pageNum === 8) {
        setupReviewPage();
    }
    
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
        autocompleteTimer = setTimeout(async () => {
            try {
                console.log('Fetching address suggestions for:', value);
                
                const response = await fetch(
                    `https://wareworks-backend.netlify.app/.netlify/functions/autocomplete-address?input=${encodeURIComponent(value)}`
                );
                
                if (!response.ok) {
                    console.error('Autocomplete API error:', response.status);
                    return;
                }
                
                const data = await response.json();
                console.log('Autocomplete response:', data);
                
                // Clear previous suggestions
                suggestionsList.innerHTML = '';
                
                // Add new suggestions
                if (data.predictions && data.predictions.length > 0) {
                    data.predictions.forEach(prediction => {
                        const option = document.createElement('option');
                        option.value = prediction.description;
                        option.dataset.placeId = prediction.place_id;
                        suggestionsList.appendChild(option);
                    });
                    console.log(`Added ${data.predictions.length} address suggestions`);
                } else {
                    console.log('No address suggestions found');
                }
                
            } catch (error) {
                console.error('Address autocomplete error:', error);
                // Don't show error to user - just fail silently
            }
        }, 300); // 300ms delay
    });
    
    console.log('Address autocomplete setup complete');
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
    // Remove any duplicate submit buttons from the page content
    const pageSubmitButtons = document.querySelectorAll('#pageContentContainer button[type="submit"], #pageContentContainer .submit-button');
    pageSubmitButtons.forEach(btn => {
        btn.style.display = 'none'; // Hide duplicate buttons
    });
    
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
        showMessage('Submitting your application...', 'info');
        
        // Save all form data
        saveFormData();
        
        // Prepare submission data
        const submitData = {
            formData: formData,
            language: 'en', // You can track this from disclaimer selection
            submissionTime: new Date().toISOString(),
            sessionId: 'sess_' + Date.now()
        };
        
        // Submit to Netlify function
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
        } else {
            nextBtn.textContent = 'Next';
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