# Deployment Notes: Document Conversion

## Current Status

The document conversion feature (DOC/DOCX → PDF) has been implemented with graceful fallback for deployment environments where LibreOffice is not available.

## Netlify Deployment

**LibreOffice is NOT available in Netlify's build environment** due to system package installation restrictions.

### What Users Will Experience:

1. **PDF files** - ✅ Work perfectly (no conversion needed)
2. **Image files** (JPEG, PNG) - ✅ Work perfectly (no conversion needed)  
3. **DOC/DOCX files** - ❌ Will show user-friendly error message

### Error Message Shown:
- **English**: "Document could not be processed. Please save as PDF and try again."
- **Spanish**: "No se pudo procesar el documento. Guarde como PDF e intente de nuevo."

## Alternative Deployment Options

If DOC/DOCX conversion is required, consider these alternatives:

### Option 1: Different Hosting Platform
Deploy to platforms that support system package installation:
- **Vercel** with custom runtime
- **Railway** with Dockerfile
- **Render** with build scripts
- **DigitalOcean App Platform** with buildpacks

### Option 2: External Conversion Service
Integrate with cloud-based document conversion APIs:
- **CloudConvert API**
- **ConvertAPI**
- **Aspose.Cloud**
- **Adobe PDF Services API**

### Option 3: Client-Side Conversion
Use browser-based conversion libraries (limited reliability):
- **pdf-lib** for basic text extraction
- **mammoth.js** for DOCX text extraction

## Current Implementation Benefits

Even without LibreOffice, the implementation provides:

1. ✅ **Proper error handling** - Users get clear guidance
2. ✅ **Bilingual support** - Error messages in English/Spanish
3. ✅ **No crashes** - Application continues to work
4. ✅ **PDF support** - Most professional documents work fine
5. ✅ **Ready for future** - Easy to enable when LibreOffice becomes available

## For HR Team

**Impact**: DOC/DOCX resumes and certifications will not be readable in the final PDF.

**Workaround**: Request applicants to:
1. Save documents as PDF before uploading
2. Use "Print to PDF" from Word/Google Docs
3. Upload images (JPEG/PNG) as alternative

## Technical Details

The DocumentConverter service automatically detects when LibreOffice is unavailable and returns:
```javascript
{
  success: false,
  error: "Document conversion service unavailable. Please save your document as PDF and try again."
}
```

This error is properly translated and displayed to users in their preferred language.