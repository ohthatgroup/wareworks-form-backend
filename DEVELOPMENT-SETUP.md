# 🚀 Development Setup Guide

## Quick Start (Fixed Redirect Issue)

### 1. Install Dependencies
```bash
cd C:\Github\wareworks-form-v2
npm install
cd apps/form-app
npm install
```

### 2. Start Development Server
```bash
# From the root directory
npm run dev
```

This will start the Next.js app on `http://localhost:3000`

### 3. Test the Webflow Embed Locally

The webflow embed is now configured to automatically detect localhost and use the correct URL:

**For testing the embed:**
1. Open `webflow-embed.html` in a browser
2. The embed will automatically redirect to `http://localhost:3000` when running locally
3. The form will load properly without the redirect error

**Webflow Embed Configuration:**
```javascript
// Auto-detects environment
FORM_APP_URL: window.location.hostname === 'localhost' || window.location.hostname.includes('webflow.io') 
  ? 'http://localhost:3000'  // Development
  : 'https://your-netlify-site.netlify.app'  // Production
```

### 4. Complete Form Structure

The form now includes all 8 steps with complete field coverage:

1. **Personal Information** (15 fields)
   - Legal name, other names, DOB, SSN
   
2. **Contact Details** (11 fields)  
   - Address with autocomplete, multiple phones, email, emergency contact
   
3. **Work Authorization** (10 fields)
   - Citizenship status with conditional fields, eligibility questions
   
4. **Position & Experience** (12 fields)
   - Position info, equipment experience levels, skills
   
5. **Availability & Preferences** (13 fields)
   - Work preferences, weekly availability, previous applications
   
6. **Education & Employment** (Dynamic)
   - Up to 3 education entries (4 fields each)
   - Up to 3 employment entries (10 fields each)
   
7. **Documents** (3 file uploads)
   - Government ID, Resume, Certifications
   
8. **Review & Submit**
   - Complete review, legal acknowledgment, submission

**Total: 80+ form fields matching PDF requirements**

### 5. Features Implemented

✅ **Complete Form Structure**
- All PDF fields mapped to web form
- Conditional logic for citizenship status
- Dynamic education/employment sections
- Proper validation with Zod schemas

✅ **Modern UI/UX**
- 8-step progressive form
- Real-time validation
- Responsive design
- Progress tracking

✅ **Development Ready**
- TypeScript throughout
- React Hook Form with validation
- Tailwind CSS styling
- Auto-save capability (localStorage)

### 6. Testing the Complete Form

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test all form steps**:
   - Fill out each step completely
   - Test conditional fields (citizenship, previous applications)
   - Add multiple education/employment entries
   - Verify validation works on all required fields

3. **Test embed integration**:
   - Open `webflow-embed.html` in browser
   - Verify redirect works to localhost:3000
   - Test language selection functionality

### 7. Next Steps for Production

When ready to deploy:

1. **Update webflow embed URL**:
   ```javascript
   FORM_APP_URL: 'https://wareworks-backend.netlify.app'
   ```

2. **Deploy to Netlify**:
   ```bash
   git push origin main  # Triggers automatic deployment
   ```

3. **Update Webflow embed**:
   - Copy updated `webflow-embed.html` to Webflow
   - Replace placeholder URLs with production URLs

### 8. Architecture Overview

```
Webflow Site (Marketing)
    ↓ 
Language Selection Embed
    ↓
Redirect to Standalone Form App
    ↓
8-Step Progressive Form
    ↓
Netlify Functions (Backend)
    ↓
Google Sheets + Email + PDF Generation
```

The form now matches the PDF requirements exactly and provides a modern, accessible user experience while maintaining the hybrid architecture benefits.