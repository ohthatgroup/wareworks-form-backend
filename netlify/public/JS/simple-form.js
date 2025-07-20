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

function nextPage() {
    console.log('Next page clicked');
    if (currentPage < totalPages) {
        loadPage(currentPage + 1);
    }
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