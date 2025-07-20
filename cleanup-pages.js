const fs = require('fs');

// Read the original content to extract just the HTML
const originalContent = fs.readFileSync('netlify/public/form-pages/all-pages-content.html', 'utf8');

// Extract just the pages content (after the All Form Pages comment)
let pagesContent = '';
const allPagesIndex = originalContent.indexOf('<!-- All Form Pages -->');
if (allPagesIndex !== -1) {
    pagesContent = originalContent.substring(allPagesIndex);
} else {
    // Extract content between the closing </style> and end
    const styleEndMatch = originalContent.match(/<\/style>([\s\S]*)/);
    if (styleEndMatch) {
        pagesContent = styleEndMatch[1];
    }
}

// Read the cleaned CSS
const cleanedCSS = fs.readFileSync('cleaned-styles.css', 'utf8');

// Create the new file
const newContent = `<!-- WareWorks Form Pages - Content Only (Cleaned) -->
<!-- This file contains all form pages with optimized CSS and pagination -->

<style>
${cleanedCSS}
</style>

${pagesContent.trim()}`;

// Write the new file
fs.writeFileSync('netlify/public/form-pages/all-pages-content.html', newContent);

console.log('✅ Cleaned up all-pages-content.html');
console.log('New file size:', newContent.length, 'characters');

// Clean up temporary files
fs.unlinkSync('cleaned-styles.css');
console.log('🗑️ Cleaned up temporary files');