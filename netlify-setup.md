# 🚀 Netlify Infrastructure & Deployment Guide

## 🏗️ Infrastructure Overview

### Production Architecture
```
Internet Traffic → Netlify CDN → Edge Network → Origin Servers
                                      ↓
┌─────────────────────────────────────────────────────────────┐
│                Netlify Platform                              │
├─────────────────────────────────────────────────────────────│
│  Frontend (Next.js 14)     │  Backend (Functions)          │
│  • Static Site Generation  │  • submit-application.ts      │
│  • App Router             │  • send-email.ts              │
│  • Tailwind CSS           │  • upload-file.ts             │
│  • React Components       │  • TypeScript Runtime         │
├─────────────────────────────────────────────────────────────│
│  Storage & Services        │  Monitoring & Security        │
│  • Netlify Blobs (Files)  │  • Analytics Dashboard        │
│  • Environment Variables  │  • Function Logs              │
│  • SSL Certificates       │  • Rate Limiting               │
│  • DNS Management         │  • CORS Policy                │
└─────────────────────────────────────────────────────────────┘
```

### Domain Architecture
- **Primary Domain**: `apply.wareworks.me` (Production)
- **Staging Domain**: `staging--wareworks-backend.netlify.app`
- **Preview Deploys**: `deploy-preview-{id}--wareworks-backend.netlify.app`
- **CDN**: Global edge network with 40+ locations

## 🚀 Quick Setup (5 Minutes)

### 1. Create Netlify Site

**Option A: GitHub Integration (Recommended)**
1. **Push code to GitHub repository**
2. **Go to [Netlify Dashboard](https://app.netlify.com)**
3. **Click "Add new site" → "Import from Git"**
4. **Connect GitHub account and select repository**
5. **Configure build settings** (auto-detected from netlify.toml):
   ```
   Base directory: apps/form-app
   Build command: npm ci && npm run build
   Publish directory: .next
   ```

**Option B: Netlify CLI**
```bash
# Install and login
npm install -g netlify-cli
netlify login

# Initialize from project root
netlify init

# Follow prompts to create new site
# Select "Create & configure a new site"
# Choose team and site name
```

### 2. Environment Variables Configuration

**Required Variables (Netlify Dashboard → Site Settings → Environment Variables):**

**Core Configuration:**
```bash
NODE_VERSION=20
NEXT_PUBLIC_API_URL=https://apply.wareworks.me
ALLOWED_ORIGINS=https://wareworks.me,https://apply.wareworks.me
```

**Feature Flags:**
```bash
ENABLE_PDF_GENERATION=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_FILE_UPLOADS=true
```

**Email Service (Mailgun):**
```bash
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=apply.wareworks.me
HR_EMAIL=hr@wareworks.me
ADMIN_EMAIL=admin@wareworks.me
```

**File Storage (Netlify Blobs):**
```bash
NETLIFY_BLOBS_URL=https://apply.wareworks.me
NETLIFY_ACCESS_TOKEN=your_netlify_access_token
```

**Optional Integrations:**
```bash
# Analytics (optional)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 3. Custom Domain Configuration

**Step 1: Add Domain in Netlify**
1. **Netlify Dashboard → Site Settings → Domain Management**
2. **Click "Add custom domain"**
3. **Enter**: `apply.wareworks.me`
4. **Verify ownership** (if required)

**Step 2: DNS Configuration**
Configure with your DNS provider (e.g., Cloudflare, GoDaddy):
```
Type: CNAME
Name: apply
Value: wareworks-backend.netlify.app
TTL: Auto (or 300 seconds)
```

**Step 3: SSL Certificate**
- **Automatically provisioned** by Netlify using Let's Encrypt
- **Force HTTPS redirect** enabled by default
- **Certificate renewal** handled automatically

## 🛠️ Advanced Configuration

### netlify.toml Configuration
**Current production configuration:**
```toml
[build]
  base = "apps/form-app"
  command = "npm ci && npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# SPA fallback for Next.js
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Environment-specific settings
[context.production.environment]
  NEXT_PUBLIC_API_URL = "https://apply.wareworks.me"

[context.deploy-preview.environment]
  NEXT_PUBLIC_API_URL = "https://apply.wareworks.me"
```

### Enhanced Production Configuration
**Add to netlify.toml for production optimization:**
```toml
# Build optimization
[build.environment]
  NODE_OPTIONS = "--max-old-space-size=4096"
  NPM_CONFIG_PRODUCTION = "false"
  
# Function configuration
[functions]
  directory = "netlify/functions"
  node_bundler = "nft"
  timeout = 30
  memory = 1024

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://maps.googleapis.com https://www.google-analytics.com;
      frame-src 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    """

# Cache optimization
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Function-specific headers
[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Access-Control-Allow-Origin = "https://wareworks.me, https://apply.wareworks.me"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
```

## 🔌 API Endpoints & Functions

### Production Function URLs
```bash
# Main application submission
POST https://apply.wareworks.me/.netlify/functions/submit-application

# Email notifications (internal)
POST https://apply.wareworks.me/.netlify/functions/send-email

# File uploads
POST https://apply.wareworks.me/.netlify/functions/upload-file

# Health check (Next.js API route)
GET https://apply.wareworks.me/api/health
```

### Function Configuration
**Memory allocation**: 1024 MB (configurable)  
**Timeout**: 30 seconds (maximum for Netlify)  
**Runtime**: Node.js 20.x  
**Bundler**: nft (Netlify Functions Toolkit)  
**Cold start**: < 500ms average

### Rate Limiting Configuration
```typescript
// Current implementation (in-memory)
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 3 // 3 submissions per IP
}

// Production recommendation: Redis-based
// Use Netlify Add-ons → Redis Cloud for persistent rate limiting
```

## 📊 Monitoring & Analytics

### Netlify Analytics
**Enable in Dashboard:**
1. **Site Settings → Analytics**
2. **Enable Netlify Analytics** ($9/month for detailed metrics)
3. **Configure custom events** for form tracking

**Metrics Available:**
- Page views and unique visitors
- Top pages and referrers  
- Bandwidth usage
- Geographic distribution
- Device and browser analytics

### Function Monitoring
**Built-in Monitoring:**
```bash
# View function logs
netlify functions:log submit-application

# Real-time logs
netlify dev --live

# Function metrics in dashboard:
# - Invocation count
# - Error rate
# - Duration statistics
# - Memory usage
```

**Custom Monitoring Setup:**
```typescript
// Add to functions for detailed monitoring
console.log(`Function invoked: ${context.functionName}`)
console.log(`Execution time: ${Date.now() - startTime}ms`)
console.log(`Memory used: ${process.memoryUsage().heapUsed / 1024 / 1024}MB`)
```

### Performance Monitoring
**Core Web Vitals Tracking:**
- **LCP (Largest Contentful Paint)**: Target < 2.5s
- **FID (First Input Delay)**: Target < 100ms  
- **CLS (Cumulative Layout Shift)**: Target < 0.1
- **TTFB (Time to First Byte)**: Target < 600ms

**Performance Budget:**
```toml
# Add to netlify.toml
[[plugins]]
  package = "netlify-plugin-lighthouse"
  
  [plugins.inputs]
    performance = 90
    accessibility = 90
    best-practices = 90
    seo = 90
```

## 🔐 Security Configuration

### Security Headers (Production)
Applied automatically via netlify.toml configuration:
- **HTTPS Enforcement**: All HTTP redirected to HTTPS
- **HSTS**: HTTP Strict Transport Security enabled
- **CSP**: Content Security Policy configured
- **Frame Protection**: X-Frame-Options: DENY
- **MIME Sniffing Protection**: X-Content-Type-Options: nosniff

### Environment Security
- **Secret Management**: All sensitive data in environment variables
- **Access Control**: Team-based access in Netlify Dashboard
- **Deploy Keys**: Separate keys for production/staging
- **Audit Logs**: Available in Netlify Pro plans

### CORS Configuration
```typescript
// Implemented in functions
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

## 🚀 Deployment Workflows

### Automatic Deployment (Recommended)
```bash
# Production deployment
git push origin main
# → Triggers automatic build and deploy to production

# Preview deployment  
git push origin feature-branch
# → Creates deploy preview at unique URL
# → Comment posted to PR with preview link
```

### Manual Deployment
```bash
# Deploy preview
netlify deploy

# Deploy to production
netlify deploy --prod

# Deploy specific directory
netlify deploy --dir=apps/form-app/.next --prod
```

### Branch-based Deployments
**Configure in Netlify Dashboard:**
```
Production branch: main
Deploy preview: All other branches
Branch deploy: staging (optional)
```

## 🔧 Build Configuration

### Build Performance Optimization
```toml
[build]
  command = "npm ci --cache .npm && npm run build"
  
[build.environment]
  NPM_CONFIG_CACHE = ".npm"
  NODE_OPTIONS = "--max-old-space-size=4096"
  NEXT_TELEMETRY_DISABLED = "1"
```

### Build Caching
**Automatic caching includes:**
- npm/yarn cache
- Next.js build cache  
- Function dependencies
- Git LFS files

**Cache management:**
```bash
# Clear build cache
netlify build --clear-cache

# View cache status
netlify build --dry-run
```

### Build Hooks
**Webhook URLs for external triggers:**
```bash
# Generated in Site Settings → Build hooks
curl -X POST https://api.netlify.com/build_hooks/{HOOK_ID}

# Use for:
# - CMS content updates
# - Scheduled rebuilds
# - External API changes
```

## 🌐 CDN & Edge Configuration

### Global CDN Network
- **Edge Locations**: 40+ worldwide
- **Cache Behavior**: Intelligent caching based on content type
- **Cache Invalidation**: Automatic on new deploys
- **Bandwidth**: Unlimited on Pro plans

### Edge Functions (Advanced)
```typescript
// Optional: Deploy edge functions for geo-routing
export default async (request: Request, context: Context) => {
  const country = context.geo?.country?.code
  
  if (country === 'MX') {
    // Route Mexican users to Spanish version
    return new Response(null, {
      status: 302,
      headers: { Location: '/?lang=es' }
    })
  }
  
  return context.next()
}
```

## 📋 Production Deployment Checklist

### Pre-deployment
- [ ] All environment variables configured in Netlify Dashboard
- [ ] Custom domain configured with DNS
- [ ] SSL certificate active
- [ ] Build settings match netlify.toml
- [ ] Function endpoints tested locally
- [ ] Performance budget configured

### Post-deployment Verification
- [ ] Site accessible at custom domain
- [ ] HTTPS redirect working
- [ ] All form steps functional
- [ ] File uploads working (test with 10MB file)
- [ ] Email notifications sent successfully
- [ ] PDF generation working (if enabled)
- [ ] Analytics tracking active
- [ ] Function logs show no errors
- [ ] Performance metrics within targets

### Monitoring Setup
- [ ] Netlify Analytics enabled
- [ ] Function monitoring configured
- [ ] Error alerting setup
- [ ] Performance monitoring active
- [ ] Security headers verified

## 🛠️ Troubleshooting

### Common Build Issues
```bash
# Error: Node version mismatch
# Solution: Set NODE_VERSION=20 in environment variables

# Error: Out of memory
# Solution: Add NODE_OPTIONS="--max-old-space-size=4096"

# Error: Function timeout
# Solution: Optimize function code or increase timeout (max 30s)
```

### Function Debug Commands
```bash
# Test function locally
netlify functions:invoke submit-application \
  --payload='{"legalFirstName":"Test","legalLastName":"User","streetAddress":"123 Main St"}'

# View function source
netlify functions:list

# Debug environment variables
netlify env:list
```

### Domain & SSL Issues
```bash
# Check DNS propagation
dig apply.wareworks.me

# Verify SSL certificate
curl -I https://apply.wareworks.me

# Check redirect configuration
curl -I http://apply.wareworks.me
```

## 📊 Cost & Usage Monitoring

### Netlify Pricing Tiers
**Free Tier** (Development):
- 100GB bandwidth/month
- 125K function requests/month
- 300 build minutes/month

**Pro Tier** ($19/month, Recommended for Production):
- 1TB bandwidth/month
- 2M function requests/month
- 1000 build minutes/month
- Advanced analytics
- Background functions

### Usage Monitoring
**Track in Netlify Dashboard:**
- Bandwidth usage
- Function invocations
- Build minutes consumed
- Storage usage (Netlify Blobs)

### Cost Optimization
```bash
# Optimize bundle size
npm run build -- --analyze

# Monitor function cold starts
netlify functions:log --level=debug

# Cache optimization
# Set appropriate Cache-Control headers
```

## 🔗 External Service Integrations

### Mailgun Integration
**DNS Records Required:**
```
Type: TXT
Name: apply.wareworks.me
Value: v=spf1 include:mailgun.org ~all

Type: CNAME  
Name: email.apply.wareworks.me
Value: mailgun.org

Type: TXT
Name: k1._domainkey.apply.wareworks.me  
Value: [Provided by Mailgun]
```

### Google Services Setup (Optional)
**Optional APIs:**
- Google Maps API (for address autocomplete)
- Gmail API (for notifications)

## 📚 Additional Resources

### Netlify Documentation
- [Build Configuration](https://docs.netlify.com/configure-builds/overview/)
- [Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Domain Management](https://docs.netlify.com/domains-https/custom-domains/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)

### Monitoring & Analytics
- [Netlify Analytics](https://docs.netlify.com/monitor-sites/analytics/)
- [Function Logs](https://docs.netlify.com/functions/logs/)
- [Core Web Vitals](https://web.dev/vitals/)

### Security Best Practices
- [Netlify Security](https://docs.netlify.com/security/secure-access-to-sites/)
- [OWASP Guidelines](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**🔗 Quick Links:**
- [Netlify Dashboard](https://app.netlify.com/sites/wareworks-backend)
- [Production Site](https://apply.wareworks.me)
- [Function Logs](https://app.netlify.com/sites/wareworks-backend/functions)
- [Analytics](https://app.netlify.com/sites/wareworks-backend/analytics)