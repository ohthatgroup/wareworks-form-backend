# 🚀 Development Setup Guide

## Prerequisites

### System Requirements
- **Node.js**: 20.0.0 or higher (required by Netlify)
- **npm**: 9.0.0 or higher
- **Git**: Latest version
- **Code Editor**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

### Required Accounts (for full functionality)
- **Netlify Account**: For deployment and functions
- **Gmail Account**: For email notifications (with App Password)
- **Mailgun Account**: For production email (optional)

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/wareworks-form-backend.git
cd wareworks-form-backend
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install form app dependencies
cd apps/form-app
npm install

# Return to root
cd ../..
```

### 3. Environment Configuration

**Create `.env.local` in `apps/form-app/`:**
```bash
# Core Configuration
NEXT_PUBLIC_API_URL=http://localhost:8888

# Feature Flags (all optional for development)
ENABLE_PDF_GENERATION=false
ENABLE_EMAIL_NOTIFICATIONS=false  
ENABLE_FILE_UPLOADS=true

# Email Configuration (optional)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
HR_EMAIL=hr@wareworks.me
ADMIN_EMAIL=admin@wareworks.me

# File Upload (uses fallback base64 storage)
NETLIFY_BLOBS_URL=http://localhost:8888
```

## 🏃 Running the Application

### Development Server
```bash
# From project root - starts both frontend and functions
npm run dev

# Or manually:
cd apps/form-app
npm run dev

# Access points:
# Frontend: http://localhost:3000
# Functions: http://localhost:8888/.netlify/functions/
```

### Alternative: Netlify CLI (Recommended)
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify (first time only)
netlify login

# Start development with functions
netlify dev

# This provides:
# Frontend: http://localhost:3000
# Functions: http://localhost:8888/.netlify/functions/
# Automatic proxy configuration
```

## 🧪 Testing the Application

### 1. Basic Form Testing
1. **Navigate to**: `http://localhost:3000`
2. **Language Selection**: Test both English and Spanish
3. **Form Steps**: Complete all 8 steps:
   - Personal Information (15 fields)
   - Contact Details (11 fields)
   - Work Authorization (10 fields)
   - Position & Experience (12 fields)
   - Availability (13 fields)
   - Education & Employment (dynamic)
   - Documents (3 file uploads)
   - Review & Submit

### 2. Validation Testing
```bash
# Test field validation
# - Leave required fields empty
# - Enter invalid formats (email, phone, SSN)
# - Test conditional logic (citizenship status)
# - Try file uploads > 10MB

# Expected behavior:
# - Real-time validation with Zod
# - User-friendly error messages
# - Form state preservation
```

### 3. API Endpoints Testing
```bash
# Test application submission
curl -X POST http://localhost:8888/.netlify/functions/submit-application \
  -H "Content-Type: application/json" \
  -d '{"legalFirstName":"John","legalLastName":"Doe","streetAddress":"123 Main St"}'

# Test file upload
curl -X POST http://localhost:8888/.netlify/functions/upload-file \
  -H "Content-Type: application/json" \
  -d '{"key":"test.pdf","data":"base64data","contentType":"application/pdf"}'

# Test email function (if configured)
curl -X POST http://localhost:8888/.netlify/functions/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","text":"Hello"}'
```

## 🔧 Development Features

### Auto-Save Functionality
- Form data automatically saved to localStorage
- Progress preserved across browser sessions
- Clear saved data option available

### Hot Reload
- Next.js hot reload for frontend changes
- Netlify Functions auto-restart on changes
- Tailwind CSS hot reload for styling

### TypeScript Integration
- Full TypeScript support across project
- Shared types between frontend and backend
- Real-time type checking in development

### Multi-language Support
- English/Spanish translations
- Dynamic language switching
- Static translation files for optimal performance

## 📊 Development Tools

### Useful Scripts
```bash
# Type checking
npm run type-check

# Linting (if configured)
npm run lint

# Build verification
npm run build

# Clean build artifacts
rm -rf apps/form-app/.next

# View function logs (with Netlify CLI)
netlify functions:log submit-application --live
```

### Debugging Tools
```bash
# Enable debug mode
DEBUG=* npm run dev

# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_API_URL)"

# Test function locally
netlify functions:invoke submit-application --payload='{"test":true}'
```

## 🌐 Webflow Integration Testing

### Local Webflow Embed Testing
1. **Create test HTML file** (`webflow-embed-test.html`):
```html
<!DOCTYPE html>
<html>
<head>
    <title>WareWorks Application - Local Test</title>
</head>
<body>
    <h1>Local Webflow Embed Test</h1>
    
    <!-- Language Selection -->
    <div id="wareworks-embed">
        <p>Select your preferred language:</p>
        <button onclick="openApplication('en')">English</button>
        <button onclick="openApplication('es')">Español</button>
    </div>

    <script>
        function openApplication(language) {
            const baseUrl = 'http://localhost:3000';
            const url = `${baseUrl}?lang=${language}`;
            window.open(url, '_blank', 'width=800,height=600');
        }
    </script>
</body>
</html>
```

2. **Test the embed**:
   - Open the HTML file in browser
   - Click language buttons
   - Verify form opens with correct language
   - Test form completion flow

## 🔍 Common Development Issues

### Port Conflicts
```bash
# If port 3000 is in use
npm run dev -- --port 3001

# If port 8888 is in use (Netlify Functions)
netlify dev --port 8889
```

### Function Timeout Issues
```bash
# Increase timeout in netlify.toml for development
[functions]
  timeout = 30
```

### Environment Variable Issues
```bash
# Check if variables are loaded
node -e "require('dotenv').config({path:'apps/form-app/.env.local'}); console.log(process.env.GMAIL_USER)"

# Restart development server after changes
```

### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Clear Next.js cache
rm -rf apps/form-app/.next
npm run dev
```

### PDF Generation Issues
```bash
# If PDFService fails, check Templates folder
ls -la Templates/
# Should contain:
# - Wareworks Application.pdf
# - i-9.pdf

# If missing, disable PDF generation
ENABLE_PDF_GENERATION=false
```

## 📋 Development Checklist

Before making changes:
- [ ] Pull latest changes from main branch
- [ ] Install dependencies (`npm install`)
- [ ] Update environment variables if needed
- [ ] Test application loads without errors

Before committing:
- [ ] Run type checking (`npm run type-check`)
- [ ] Test form submission flow
- [ ] Verify all 8 form steps work
- [ ] Check console for errors
- [ ] Test on mobile viewport
- [ ] Verify multi-language switching

Before deployment:
- [ ] Build succeeds locally (`npm run build`)
- [ ] All environment variables configured
- [ ] Test with production-like data
- [ ] Verify file uploads work
- [ ] Check email notifications (if enabled)

## 🚀 Production Preparation

### Building for Production
```bash
# Build the application
cd apps/form-app
npm run build

# Test production build locally
npm start
```

### Environment Variables for Production
Update Netlify Dashboard with production values:
```bash
NEXT_PUBLIC_API_URL=https://apply.wareworks.me
ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_FILE_UPLOADS=true
MAILGUN_API_KEY=key-xxxxxxxxxx
MAILGUN_DOMAIN=apply.wareworks.me
# ... other production variables
```

### Pre-deployment Testing
1. **Test with production environment variables**
2. **Verify all integrations work (email, files, PDFs)**
3. **Test form submission end-to-end**
4. **Check mobile responsiveness**
5. **Verify multi-language functionality**

## 📚 Additional Resources

### Documentation Links
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Netlify Functions Guide](https://docs.netlify.com/functions/overview/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form Guide](https://react-hook-form.com/get-started)
- [Zod Validation Documentation](https://zod.dev/)

### Helpful Tools
- [Netlify CLI Commands](https://cli.netlify.com/)
- [Next.js DevTools](https://nextjs.org/docs/app/building-your-application/optimizing/devtools)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [PDF-lib Documentation](https://pdf-lib.js.org/)

## 🆘 Getting Help

### Debug Information to Collect
When reporting issues, include:
1. **Node.js version**: `node --version`
2. **npm version**: `npm --version`
3. **Operating system**: Windows/Mac/Linux
4. **Browser and version**: Chrome 120+, Safari 17+, etc.
5. **Console errors**: Copy full error messages
6. **Environment variables**: (without sensitive values)
7. **Steps to reproduce**: Detailed reproduction steps

### Common Solutions
1. **"Module not found" errors**: Run `npm install`
2. **"Port already in use"**: Kill existing processes or use different port
3. **"Environment variable undefined"**: Check `.env.local` file and restart dev server
4. **TypeScript errors**: Run `npm run type-check` for detailed errors
5. **Function timeout**: Increase timeout in netlify.toml

---

**Next Steps**: Once development setup is complete, see [Netlify Deployment Guide](./netlify-setup.md) for production deployment instructions.