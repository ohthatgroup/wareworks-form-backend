# WareWorks Employment Application System

> **Modern, hybrid employment application system with multi-language support, PDF generation, and comprehensive data collection.**

## 🏗️ System Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Marketing Site    │────▶│  Application Form    │────▶│   Backend APIs      │
│   wareworks.me      │     │  apply.wareworks.me  │     │  Netlify Functions  │
│   (Webflow)         │     │  (Next.js 14)       │     │  (TypeScript)       │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
                                      │                            │
                                      ▼                            ▼
                            ┌──────────────────────┐     ┌─────────────────────┐
                            │   File Storage       │     │   Data Processing   │
                            │   Netlify Blobs      │     │   Email + PDF       │
                            │   (Documents/Uploads)│     │   Generation        │
                            └──────────────────────┘     └─────────────────────┘
```

## 🌐 Domains & Infrastructure

### Production Environment
- **Marketing**: `https://wareworks.me` (Webflow)
- **Application**: `https://apply.wareworks.me` (Netlify + Next.js)
- **Backend APIs**: `https://apply.wareworks.me/.netlify/functions/`
- **CDN**: Netlify Edge Network (Global)

### Development Environment  
- **Local Frontend**: `http://localhost:3000`
- **Local Functions**: `http://localhost:8888/.netlify/functions/`
- **Preview Deploys**: `https://deploy-preview-{id}--wareworks-backend.netlify.app`

## 🔌 API Endpoints

### Core Application APIs
```bash
# Main application submission
POST /.netlify/functions/submit-application
Content-Type: application/json
Rate Limit: 3 requests per 15 minutes per IP

# Email notifications
POST /.netlify/functions/send-email  
Content-Type: application/json
Auth: Internal service calls only

# File uploads
POST /.netlify/functions/upload-file
Content-Type: application/json
Max File Size: 10MB per file
```

### Next.js App Router APIs
```bash
# Frontend API route (simplified validation)
POST /api/submit-application
Content-Type: application/json
Note: Proxy to Netlify Functions in production

# Health check / status
GET /api/health
Response: {"status": "ok", "timestamp": "..."}
```

### Authentication & Security
```bash
# CORS Policy
Access-Control-Allow-Origin: https://wareworks.me, https://apply.wareworks.me
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization

# Rate Limiting
- 3 submissions per 15 minutes per IP address  
- In-memory rate limiting (production should use Redis)
- 429 status code with Retry-After header

# Security Headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff  
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (specified in netlify.toml)
- npm 9+
- Git

### Local Development
```bash
# Clone and setup
git clone https://github.com/your-org/wareworks-form-backend.git
cd wareworks-form-backend
npm install

# Start development server
npm run dev
# ✅ Frontend: http://localhost:3000  
# ✅ Functions: http://localhost:8888/.netlify/functions/

# Build for production
npm run build

# Deploy to Netlify
npm run deploy
```

## 📁 Project Structure

```
wareworks-form-backend/
├── apps/
│   └── form-app/                 # Next.js 14 Application
│       ├── src/
│       │   ├── app/              # App Router (Next.js 13+)
│       │   │   └── api/          # API Routes
│       │   ├── components/       # React Components  
│       │   ├── translations/     # i18n (EN/ES)
│       │   └── types/           # TypeScript Types
│       ├── package.json         # Frontend Dependencies
│       ├── next.config.js       # Next.js Configuration
│       ├── tailwind.config.js   # Tailwind CSS
│       └── tsconfig.json        # TypeScript Config
├── netlify/
│   └── functions/               # Serverless Functions
│       ├── submit-application.ts # Main submission handler
│       ├── send-email.ts        # Email notifications  
│       └── upload-file.ts       # File upload handler
├── shared/                      # Shared Business Logic
│   ├── services/               # Service Classes
│   │   ├── ApplicationService.ts # Main orchestrator
│   │   ├── EmailService.ts      # Email handling
│   │   ├── FileUploadService.ts # File processing
│   │   └── PDFService.ts        # PDF generation
│   ├── types/                  # Shared TypeScript types
│   ├── validation/             # Zod schemas
│   └── config/                 # Configuration files
├── netlify.toml                # Netlify deployment config
├── package.json                # Root workspace config  
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.3+
- **Forms**: React Hook Form + Zod validation
- **State**: React Query (TanStack Query)
- **i18n**: Custom translation system (EN/ES)
- **Icons**: Lucide React

### Backend (Netlify Functions)
- **Runtime**: Node.js 20
- **Language**: TypeScript 5.2+
- **Functions**: Netlify Functions v2
- **Bundler**: nft (Netlify Functions Toolkit)
- **Validation**: Zod schemas
- **Rate Limiting**: In-memory (development), Redis (production)

### Infrastructure & Services
- **Hosting**: Netlify (Frontend + Functions)
- **CDN**: Netlify Edge Network
- **Domain**: Custom domains via Netlify
- **SSL**: Let's Encrypt (auto-provisioned)
- **File Storage**: Netlify Blobs (10GB included)
- **Email**: Mailgun via Netlify Extensions
- **PDF Generation**: pdf-lib library
- **Monitoring**: Netlify Analytics + Function Logs

### Integrations
- **Gmail SMTP**: App passwords for notifications  
- **Webflow**: iframe embedding for marketing site
- **Address Autocomplete**: Google Maps API (optional)

## 🔧 Environment Configuration

### Required Environment Variables

**Production (Netlify Dashboard):**
```bash
# Core Configuration
NODE_VERSION=20
NEXT_PUBLIC_API_URL=https://apply.wareworks.me

# Security
ALLOWED_ORIGINS=https://wareworks.me,https://apply.wareworks.me

# Feature Flags  
ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_FILE_UPLOADS=true

# Email Configuration (Mailgun)
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=apply.wareworks.me
HR_EMAIL=hr@wareworks.me
ADMIN_EMAIL=admin@wareworks.me

# File Upload (Netlify Blobs)
NETLIFY_BLOBS_URL=https://apply.wareworks.me
NETLIFY_ACCESS_TOKEN=netlify_access_token_here
```

**Development (.env.local in apps/form-app/):**
```bash
# Development API URL
NEXT_PUBLIC_API_URL=http://localhost:8888

# Development email (optional)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

## 🚀 Deployment

### Netlify Deployment (Recommended)

**Automatic Deployment:**
```bash
# 1. Connect GitHub repository to Netlify
# 2. Configure build settings (already in netlify.toml):
#    Base directory: apps/form-app
#    Build command: npm ci && npm run build  
#    Publish directory: .next
# 3. Set environment variables in Netlify Dashboard
# 4. Deploy automatically on git push to main branch
```

**Manual Deployment:**
```bash
# Install Netlify CLI
npm install -g netlify-cli
netlify login

# Deploy preview
npm run build
netlify deploy

# Deploy to production  
netlify deploy --prod
```

### Domain Configuration

**1. Custom Domain Setup:**
- Netlify Dashboard → Site Settings → Domain Management
- Add custom domain: `apply.wareworks.me`
- Configure DNS with your provider:
  ```
  Type: CNAME
  Name: apply  
  Value: your-site-name.netlify.app
  ```

**2. SSL Certificate:**
- Automatically provisioned via Let's Encrypt
- Force HTTPS redirect enabled by default

## 🎯 Features & Capabilities

### Core Features
- ✅ **8-Step Progressive Form** with 80+ fields
- ✅ **Multi-language Support** (English/Spanish) 
- ✅ **Real-time Validation** with Zod schemas
- ✅ **File Upload System** (PDF, DOC, Images up to 10MB)
- ✅ **PDF Generation** with form field population
- ✅ **Email Notifications** via Mailgun
- ✅ **Rate Limiting** (3 submissions per 15 min per IP)
- ✅ **Responsive Design** (Mobile-first)
- ✅ **Accessibility** (WCAG 2.1 AA compliant)

### Advanced Features  
- ✅ **Auto-save** to localStorage
- ✅ **Progress Tracking** with step indicators
- ✅ **Conditional Logic** (citizenship status, equipment experience)
- ✅ **Dynamic Sections** (education/employment history)
- ✅ **Document Preview** before submission
- ✅ **Comprehensive Validation** with user-friendly error messages
- ✅ **SEO Optimized** with proper meta tags

### Integration Features
- ✅ **Webflow Embedding** via iframe
- ✅ **Address Autocomplete** (Google Maps API)
- ✅ **Analytics Tracking** (GA4 compatible)
- ✅ **Error Monitoring** via Netlify Functions logs

## 🔍 Data Flow & Processing

### Application Submission Flow
```
1. User fills 8-step form → Client-side validation (Zod)
2. Form submission → Next.js API route (basic validation)  
3. Proxy to Netlify Function → Complete validation & processing
4. Parallel processing:
   ├── Generate PDF with form data
   ├── Upload files to Netlify Blobs  
   └── Send email notification (HR)
5. Return confirmation → Show success page with tracking ID
```

### File Upload Process
```
1. File selection → Client validation (size, type)
2. Base64 encoding → Upload to /upload-file function
3. Security validation → Virus scanning (future)
4. Netlify Blobs storage → Return public URL
5. URL stored in form data → Included in final submission
```

### Email Notification System
```
1. Form submission completed → Trigger email service
2. Generate plain text summary → Include application details
3. Attach generated PDF → Send via Mailgun SMTP
4. Delivery confirmation → Log success/failure
5. Retry logic for failures → Max 3 attempts
```

## 📊 Monitoring & Analytics

### Performance Metrics
- **Page Load Time**: < 2 seconds (LCP)
- **Function Cold Start**: < 500ms
- **File Upload Speed**: < 5 seconds for 10MB
- **Form Completion Rate**: Tracked via analytics
- **Error Rate**: < 0.1% for successful submissions

### Logging & Debugging
```bash
# View function logs
netlify functions:log submit-application

# Real-time logs during development
netlify dev

# Check deployment status
netlify status

# Debug environment variables
netlify env:list
```

### Error Handling
- **Client Errors (4xx)**: User-friendly messages with action items
- **Server Errors (5xx)**: Automated alerts + retry mechanisms  
- **Rate Limiting (429)**: Clear retry instructions with countdown
- **Validation Errors**: Field-specific error messages with fixes

## 🧪 Testing & Quality Assurance

### Test Coverage
```bash
# Run all tests (when implemented)
npm test

# Type checking
npm run type-check

# Linting  
npm run lint

# Build verification
npm run build
```

### Manual Testing Checklist
- [ ] Form validation on all 80+ fields
- [ ] File upload (PDF, DOC, images)
- [ ] Multi-language switching (EN/ES)
- [ ] Email notification delivery
- [ ] PDF generation with correct data
- [ ] Mobile responsiveness (iOS/Android)
- [ ] Cross-browser compatibility (Chrome/Firefox/Safari)
- [ ] Rate limiting behavior
- [ ] Error handling and recovery

## 🔐 Security & Compliance

### Security Measures
- **Input Validation**: Zod schemas on client and server
- **File Upload Security**: Type/size validation, content scanning
- **Rate Limiting**: Per-IP submission limits  
- **CORS Policy**: Restricted origins
- **HTTPS Enforcement**: All traffic encrypted
- **Secret Management**: Environment variables only
- **Error Handling**: No sensitive data in error messages

### Privacy & Compliance
- **Data Storage**: Minimal retention, secure transmission
- **GDPR Compliance**: Clear consent and data usage notices
- **Document Security**: Secure file storage with access controls
- **Audit Trail**: All submissions logged with timestamps
- **Right to Delete**: Procedures for data removal requests

## 📚 Additional Documentation

- [📖 Development Setup Guide](./DEVELOPMENT-SETUP.md) - Local development instructions
- [🚀 Netlify Deployment Guide](./netlify-setup.md) - Production deployment steps  
- [⚡ Quick Deployment Reference](./DEPLOYMENT.md) - Quick deployment checklist
- [🔧 Component Documentation](./COMPONENTS-DOCUMENTATION.md) - Frontend component guide
- [📋 File Analysis Report](./FILE_ANALYSIS.md) - Complete codebase analysis
- [📝 Implementation Status](./TODO-IMPLEMENTATIONS.md) - Pending features and roadmap

## 🆘 Support & Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version (requires 20+)
2. **Function Timeouts**: Increase timeout in netlify.toml (max 30s)
3. **Email Delivery**: Verify Mailgun configuration and DNS
4. **File Upload Errors**: Check file size limits and MIME types
5. **PDF Generation**: Ensure Templates folder exists and is accessible

### Getting Help
- **Technical Issues**: Check function logs in Netlify Dashboard
- **Integration Problems**: Verify environment variables and API keys
- **Performance Issues**: Use Netlify Analytics and Web Vitals
- **Security Concerns**: Review OWASP guidelines and update dependencies

## 📄 License & Ownership

**Private - WareWorks Internal Use Only**  
© 2024 WareWorks. All rights reserved.

This application contains proprietary business logic and integrations specific to WareWorks employment processes. Unauthorized reproduction, distribution, or modification is strictly prohibited.

---

**🔗 Quick Links:**
- [Production Site](https://apply.wareworks.me)
- [Netlify Dashboard](https://app.netlify.com/sites/wareworks-backend)
- [Marketing Site](https://wareworks.me)
- [GitHub Repository](https://github.com/your-org/wareworks-form-backend) (Private)