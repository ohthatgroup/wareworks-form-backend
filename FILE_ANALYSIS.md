# Wareworks Form Backend - File Analysis

## Overview
This document provides a comprehensive analysis of each file in the project, documenting:
- What each file does (brief description)
- Dependencies (files it depends on)
- Dependents (files that depend on it)
- Potential script errors
- Recommendation: Stay, Update, or Delete

---

## Root Level Files

### Configuration Files

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| package.json | Root workspace config, manages apps/packages | None | All npm scripts, workspace deps | None | **Stay** |
| package-lock.json | Dependency lock file | package.json | npm install | None | **Stay** |
| .env.example | Environment variables template | None | Deployment setup | **SECURITY: Contains actual private key** | **Update** - Remove real credentials |
| template-analysis.json | PDF field mapping reference data | None | PDFService, field mappings | None | **Stay** |

### Documentation Files  

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| README.md | Project documentation | None | Developers | None | **Stay** |
| COMPONENTS-DOCUMENTATION.md | Component docs | None | Developers | None | **Stay** |
| DEVELOPMENT-SETUP.md | Setup instructions | None | Developers | None | **Stay** |
| GOOGLE_SHEETS_SETUP.md | Google Sheets config | None | Developers | None | **Stay** |
| netlify-setup.md | Netlify deployment docs | None | Developers | None | **Stay** |
| style-guide.txt | Style guidelines | None | Developers | None | **Stay** |
| TODO-IMPLEMENTATIONS.md | Todo list | None | Developers | None | **Stay** |

---

## Shared Directory - Core Business Logic

### Type Definitions

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| shared/types/index.ts | Core type definitions for ApplicationData | None | All services, validation, API routes | None | **Stay** |

### Validation

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| shared/validation/schemas.ts | Zod validation schemas | zod library | API routes, form submission | None | **Stay** |

### Configuration

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| shared/config/pdfFieldMappings.ts | PDF form field mapping config | shared/types | PDFService | None | **Stay** |

### Services

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| shared/services/ApplicationService.ts | Main application submission orchestrator | EmailService, PDFService, ValidationSchemas | API routes | None | **Stay** |
| shared/services/EmailService.ts | Email notification service via Netlify | ValidationSchemas | ApplicationService | **BUG: Contains duplicate PDFService class** | **Update** - Remove duplicate PDFService |
| shared/services/FileUploadService.ts | File upload/validation service | ValidationSchemas | API routes, ApplicationService | None | **Stay** |
| shared/services/PDFService.ts | PDF generation and form filling | pdf-lib, field mappings, ValidationSchemas | ApplicationService | **ERROR: References missing Templates folder** | **Update** - Fix template paths |

---

---

## Netlify Functions - Serverless Backend

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| netlify/functions/send-email.ts | Email notification via Mailgun | @netlify/functions | EmailService | None | **Stay** |
| netlify/functions/submit-application.ts | Main application submission endpoint | @netlify/functions, shared services | Form frontend | None | **Stay** |
| netlify/functions/upload-file.ts | File upload to Netlify Blobs | @netlify/functions | FileUploadService | None | **Stay** |

---

## Form App - Next.js Frontend

### API Routes

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| apps/form-app/src/app/api/submit-application/route.ts | Simplified frontend API route | Next.js | Form components | **WARNING: Basic validation only** | **Update** - Add proper validation |

### Source Files

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| apps/form-app/src/shared/validation/schemas.ts | Form validation schemas (local copy) | zod | Form components | **DUPLICATE: Different from shared/validation** | **Update** - Consolidate with shared validation |
| apps/form-app/src/translations/index.ts | I18n translations (English/Spanish) | None | Form components | None | **Stay** |
| apps/form-app/src/types/translations.ts | TypeScript types for translations | translations/index.ts | Form components | None | **Stay** |

### Configuration Files

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| apps/form-app/package.json | Next.js app dependencies | None | npm scripts, build process | None | **Stay** |
| apps/form-app/next.config.js | Next.js configuration | None | Next.js build | None | **Stay** |
| apps/form-app/tailwind.config.js | Tailwind CSS configuration | None | CSS compilation | None | **Stay** |
| apps/form-app/tsconfig.json | TypeScript configuration | None | TypeScript compiler | None | **Stay** |
| apps/form-app/postcss.config.js | PostCSS configuration | None | CSS processing | None | **Stay** |
| apps/form-app/.eslintrc.json | ESLint configuration | None | Code linting | None | **Stay** |
| apps/form-app/.env.example | Environment variables example | None | Development setup | None | **Stay** |
| apps/form-app/next-env.d.ts | Next.js TypeScript declarations | Next.js | TypeScript | None | **Stay** |

### Environment Files (Local)

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| apps/form-app/.env.local | Local environment variables (git-ignored) | None | Next.js runtime | None | **Stay** |
| apps/form-app/.env.local.example | Environment template | None | Development setup | None | **Stay** |

---

## Build Artifacts (.next directory)

**CRITICAL**: All files in apps/form-app/.next/ are build artifacts that should be deleted from git.

| File Pattern | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| .next/static/chunks/*.js | Compiled JavaScript chunks | Next.js build | Browser runtime | **GIT TRACKING ERROR** | **DELETE** - All build artifacts |
| .next/static/webpack/*.json | Webpack hot reload manifests | Next.js dev | Dev server | **GIT TRACKING ERROR** | **DELETE** - Dev artifacts |
| .next/server/* | Server-side build files | Next.js build | SSR runtime | **GIT TRACKING ERROR** | **DELETE** - Build outputs |
| .next/*.json | Build manifests | Next.js build | Runtime | **GIT TRACKING ERROR** | **DELETE** - Build metadata |

**Issue**: The .gitignore correctly excludes `.next` (line 74, 8) but 100+ build files are currently tracked in git.

---

## Git Configuration

| File | Purpose | Dependencies | Dependents | Errors | Recommendation |
|------|---------|--------------|------------|---------|----------------|
| .gitignore | Git exclusion rules | None | Git operations | **CONFLICT: .next dir tracked despite exclusion** | **Update** - Remove .next from git |
| .claude/settings.local.json | Claude Code settings | None | Claude IDE | None | **Stay** |

---

## Analysis Progress  
- ✅ All files analyzed systematically
- ✅ Dependencies mapped
- ✅ Error conditions identified  
- ✅ Recommendations provided

---

## Summary of Critical Issues

### 🔥 SECURITY ISSUES
1. **.env.example contains real private key** - Remove actual credentials immediately
2. **Build artifacts in git** - 100+ .next files should not be tracked

### 🐛 CODE ISSUES  
1. **Duplicate PDFService** in EmailService.ts - Remove duplicate class
2. **Missing Templates folder** referenced by PDFService
3. **Duplicate validation schemas** - Consolidate shared vs form-app versions
4. **Basic validation only** in form-app API route

### 📁 ARCHITECTURE ISSUES
1. **Build artifacts pollution** - .next directory should be git-ignored
2. **Validation schema duplication** - Two different versions exist
3. **Template path references** - PDFService looks for non-existent Templates folder

---

*This analysis is being updated systematically. Each file will be examined for functionality, dependencies, and recommendations.*