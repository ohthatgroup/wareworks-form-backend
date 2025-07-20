# WareWorks Application Form System Documentation

## Overview

The WareWorks Application Form System is a comprehensive web-based employment application platform that collects applicant information, processes documents, and generates combined PDF packages for HR review. The system is built on Netlify Functions with Google Sheets integration and secure document storage.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Netlify         │    │  External       │
│   (Webflow)     │───▶│  Functions       │───▶│  Services       │
│                 │    │  (Backend)       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Netlify Blobs  │    │ Google Sheets   │
                       │  (File Storage) │    │ (Data Storage)  │
                       └─────────────────┘    └─────────────────┘
```

## Core Features

1. **Multi-page Form Interface**: 8-page progressive form with validation
2. **Address Autocomplete**: Google Maps API integration for address suggestions
3. **Document Upload**: Secure file upload with validation and storage
4. **PDF Generation**: Automated PDF creation combining templates and uploaded documents
5. **Data Persistence**: Google Sheets integration for application tracking
6. **Email Delivery**: Automated email sending with PDF attachments
7. **Security**: Rate limiting, file validation, and domain restrictions

## File Structure and Descriptions

### Frontend Files (`netlify/public/`)

#### `JS/simple-form.js`
**Purpose**: Main frontend application logic
- **Page Navigation**: Handles 8-page form progression with validation
- **Address Autocomplete**: Integrates Google Maps JavaScript API for address suggestions
- **Input Formatting**: Automatic formatting for phone numbers and SSN
- **Document Upload**: Manages file uploads and converts to base64 for transmission
- **Form Submission**: Three-step process: upload documents → process data → submit application
- **Data Persistence**: Saves form data to localStorage and restores on page reload

#### `form-pages/page1-personal-info.html`
**Purpose**: Personal information collection
- Legal name fields (first, middle, last, other names)
- Address information with Google Maps autocomplete
- Contact information (phone, email)
- Date of birth and Social Security Number

#### `form-pages/page2-contact.html`
**Purpose**: Extended contact and emergency information
- Home and cell phone numbers
- Emergency contact details (name, phone, relationship)
- Additional contact preferences

#### `form-pages/page3-citizenship.html`
**Purpose**: Citizenship and work authorization
- Citizenship status selection
- USCIS A-Number for non-citizens
- Work authorization expiration dates
- Document type and number fields

#### `form-pages/page4-documents.html`
**Purpose**: Document upload interface
- **Required**: Government-issued ID (JPEG, PNG, PDF up to 10MB)
- **Optional**: Resume (PDF, DOC, DOCX up to 10MB)
- **Optional**: Certifications (Multiple files, JPEG, PNG, PDF up to 10MB each)
- Real-time file validation and preview

#### `form-pages/page5-application-questions.html`
**Purpose**: Employment-specific questions
- Age verification (18+)
- Transportation availability
- Work authorization confirmation
- Full-time employment preference
- Shift availability (swing shifts, graveyard shifts)
- Weekly availability schedule (Sunday-Saturday)
- Position applied for and salary expectations
- Job discovery source
- Previous WareWorks application history

#### `form-pages/page6-education-history.html`
**Purpose**: Educational background
- School information (name, location, years attended)
- Graduation status and degrees
- Multiple education entries supported

#### `form-pages/page7-employment-history.html`
**Purpose**: Work experience collection
- Previous employers (company, position, dates)
- Job responsibilities and experience
- Multiple employment entries supported

#### `form-pages/page8-review-submit.html`
**Purpose**: Final review and submission
- Summary of all entered information
- Document upload confirmation
- Final submission trigger

#### `External Files/simple-webflow-embed.html`
**Purpose**: Webflow integration code
- Complete HTML structure for embedding in Webflow
- Includes Google Maps API integration
- Language disclaimer and form container
- Progress indicators and navigation controls

### Backend Functions (`netlify/functions/`)

#### `submit-application.js`
**Purpose**: Main application processing endpoint
- **Security Validation**: Rate limiting, domain verification, data sanitization
- **Data Processing**: Form validation and Google Sheets integration
- **PDF Generation**: Combines templates with form data and uploaded documents
- **Email Delivery**: Sends combined PDF to HR recipients
- **Error Handling**: Comprehensive logging and error management

**Key Functions**:
- `validateSubmission()`: Security and data validation
- `processSubmission()`: Orchestrates the entire submission workflow
- `saveToGoogleSheets()`: Stores application data in Google Sheets
- `generateApplicationPDF()`: Creates comprehensive PDF package
- `loadAndPopulateApplicationTemplate()`: Populates WareWorks template
- `loadAndPopulateI9Template()`: Populates I-9 form template
- `sendEmailWithAttachment()`: Delivers PDF via email

#### `upload-documents.js`
**Purpose**: Document upload and storage handler
- **File Validation**: Type, size, and security checks
- **Netlify Blobs Storage**: Secure cloud storage with unique document IDs
- **Metadata Tracking**: File information and upload timestamps
- **URL Generation**: Creates permanent access URLs for stored documents

**Security Features**:
- File type whitelist validation
- 10MB size limit enforcement
- Base64 encoding validation
- Unique document ID generation

#### `analyze-templates.js`
**Purpose**: PDF template analysis utility
- **Field Discovery**: Identifies fillable form fields in PDF templates
- **Template Validation**: Ensures templates have expected form structure
- **Development Tool**: Helps map form data to PDF field names

**Analysis Output**:
- Field count and types (text, checkbox, radio, dropdown)
- Field names and current values
- Template page count and structure

### PDF Templates (`Templates/`)

#### `Wareworks Application.pdf`
**Purpose**: Official WareWorks employment application template
- **66 fillable form fields** for comprehensive applicant information
- Standard employment application format
- Populated automatically with form data using pdf-lib

#### `i-9.pdf`
**Purpose**: Federal I-9 Employment Eligibility Verification form
- **128 fillable form fields** for identity and work authorization verification
- Required federal form for all employees
- Populated automatically with citizenship and document information

### Configuration Files

#### `package.json`
**Purpose**: Node.js project configuration
- **Dependencies**: All required npm packages
  - `googleapis`: Google Sheets API integration
  - `pdf-lib`: PDF manipulation and form filling
  - `@netlify/blobs`: Document storage
  - `nodemailer`: Email delivery
  - `moment`: Date/time handling

#### `.gitignore`
**Purpose**: Git exclusion rules
- Excludes `node_modules/` from version control
- Protects sensitive environment files
- Prevents temporary files from being committed

### Environment Variables (Not in repository)

#### Required Netlify Environment Variables:
- `GOOGLE_SHEETS_SPREADSHEET_ID`: Target Google Sheets document ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account for Sheets API
- `GOOGLE_PRIVATE_KEY`: Private key for service account authentication
- `EMAIL_USER`: Gmail account for sending notifications
- `EMAIL_PASS`: App password for Gmail SMTP
- `HR_EMAIL_RECIPIENTS`: Comma-separated list of HR email addresses
- `ENABLE_GOOGLE_SHEETS`: Boolean flag to enable/disable Sheets integration
- `ENABLE_PDF_GENERATION`: Boolean flag to enable/disable PDF creation
- `ENABLE_EMAIL_NOTIFICATIONS`: Boolean flag to enable/disable email sending

## Data Flow

### 1. Form Submission Process
```
User fills form → Frontend validation → Document upload to Blobs → 
Data submission → Backend validation → Google Sheets storage → 
PDF generation → Email delivery → Success confirmation
```

### 2. Document Processing
```
File upload → Security validation → Base64 encoding → 
Netlify Blobs storage → URL generation → Metadata tracking → 
PDF embedding → Permanent storage
```

### 3. PDF Generation Pipeline
```
Form data + Templates + Uploaded documents → 
Template population → Document merging → 
Final PDF creation → Email attachment
```

## Security Features

### Input Validation
- **Data Sanitization**: All inputs cleaned and validated
- **File Type Restrictions**: Only approved file formats accepted
- **Size Limits**: 10MB maximum per file
- **Rate Limiting**: Prevents spam and abuse

### Access Control
- **Domain Restrictions**: Only specified domains can submit
- **Referer Validation**: Ensures requests come from authorized sources
- **CORS Configuration**: Proper cross-origin resource sharing setup

### Data Protection
- **SSN Hashing**: Social Security Numbers are hashed in Google Sheets
- **Secure Storage**: Documents stored in encrypted Netlify Blobs
- **No Logging**: Sensitive data not logged in plain text

## Integration Points

### Google Sheets API
- **Authentication**: Service account with JSON key
- **Data Structure**: Structured columns for all form fields
- **Error Handling**: Graceful fallback if Sheets unavailable

### Google Maps API
- **Frontend Integration**: JavaScript API for address autocomplete
- **Restrictions**: Limited to US addresses only
- **Fallback**: Form still functions without API

### Netlify Blobs
- **Storage**: Permanent document storage with unique URLs
- **Metadata**: File information and upload tracking
- **Access Control**: Secure URL generation for document access

### Email Delivery
- **SMTP**: Gmail SMTP for reliable delivery
- **Attachments**: PDF packages attached automatically
- **Recipients**: Configurable HR email list

## Maintenance and Monitoring

### Error Handling
- **Comprehensive Logging**: All operations logged with context
- **Graceful Degradation**: System continues functioning if non-critical services fail
- **User Feedback**: Clear error messages for form validation issues

### Performance Optimization
- **Lazy Loading**: Form pages loaded on demand
- **Debounced Autocomplete**: Prevents excessive API calls
- **Efficient PDF Generation**: Optimized template processing

### Monitoring Points
- **Submission Success Rate**: Track successful vs. failed submissions
- **Document Upload Success**: Monitor file storage reliability
- **Email Delivery**: Confirm HR notifications sent
- **API Response Times**: Google Sheets and Maps API performance

## Deployment

### Netlify Configuration
- **Build Command**: `npm install` (automatically runs)
- **Functions Directory**: `netlify/functions/`
- **Public Directory**: `netlify/public/`
- **Environment Variables**: Set in Netlify dashboard

### Dependencies
- **Node.js**: Server-side JavaScript runtime
- **NPM Packages**: Listed in package.json
- **External APIs**: Google Sheets, Google Maps, Gmail SMTP

## GitHub Deployment

**Important**: Do **NOT** push `node_modules/` to GitHub. The `node_modules` folder should always be included in your `.gitignore` file because:

1. **Size**: node_modules can be extremely large (hundreds of MBs or GBs)
2. **Redundancy**: Anyone can recreate it by running `npm install`
3. **Platform differences**: Some packages have platform-specific binaries
4. **Repository bloat**: It makes your repo unnecessarily large and slow

Instead:
- Keep your `package.json` and `package-lock.json` files committed
- Let Netlify run `npm install` during deployment (which it does automatically)
- Your `.gitignore` should include `node_modules/`

## Troubleshooting

### Common Issues
1. **Address Autocomplete Not Working**: Check Google Maps API key and restrictions
2. **Form Submission Failing**: Verify environment variables and API credentials
3. **PDF Generation Errors**: Ensure template files exist and have fillable fields
4. **Email Delivery Issues**: Check Gmail app password and SMTP settings

### Debug Tools
- **Template Analyzer**: Use `analyze-templates.js` to inspect PDF structure
- **Console Logging**: Comprehensive logs in browser and Netlify Functions
- **Error Messages**: User-friendly validation feedback

---

*This documentation provides a complete technical overview of the WareWorks Application Form System. For implementation details, refer to the individual source code files.*