// Quick fix for language issue - run in browser console

console.log('🔧 Quick Language Fix');
console.log('Current localStorage language:', localStorage.getItem('preferred-language'));

// Force English
localStorage.setItem('preferred-language', 'en');
console.log('✅ Set preferred language to English');

// Reload page to apply changes
console.log('🔄 Reloading page to apply changes...');
window.location.reload();