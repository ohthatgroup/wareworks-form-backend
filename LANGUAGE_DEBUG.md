# Language Issue Debugging Instructions

## Current Issue
Spanish is loading instead of English, even when English is selected.

## Debugging Steps

### 1. Check Browser Console
- Open the form in development mode
- Check browser console for language detection logs
- Look for messages starting with "Language detection:" and "LanguageProvider initialized"

### 2. Use Debug Component
- In development mode, a debug panel appears in the bottom-right corner
- Shows current language setting
- Provides buttons to:
  - Set English/Spanish manually
  - Clear preferences and reset to English
  - Show debug info in console

### 3. Check Browser Storage
```javascript
// Run in browser console:
console.log('LocalStorage language:', localStorage.getItem('preferred-language'))
console.log('URL params:', new URLSearchParams(window.location.search).get('lang'))
```

### 4. Clear Browser Storage
```javascript
// Clear language preferences:
localStorage.removeItem('preferred-language')
location.reload()
```

## Potential Causes

1. **URL Parameter**: Check if `?lang=es` is in the URL
2. **LocalStorage**: Previous Spanish selection stored in browser
3. **Browser Language**: System language detection
4. **Default State**: Race condition in language initialization

## Fixes Applied

1. ✅ Added explicit English default in LanguageProvider
2. ✅ Added debug logging for language detection
3. ✅ Force save English as default when no preference exists
4. ✅ Added debug component for testing

## Testing

1. Clear browser cache and localStorage
2. Visit form without URL parameters
3. Check that English loads by default
4. Switch to Spanish and back to English
5. Refresh page and verify English persists

## Production Cleanup

Before deploying, remove:
- Debug logging (`console.log` statements)
- `LanguageDebug` component import and usage
- Development-only debug panel