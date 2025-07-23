# WareWorks Application Form v2

Modern, hybrid employment application system with Webflow integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Netlify
npm run deploy
```

## 📁 Project Structure

```
wareworks-form-v2/
├── apps/
│   └── form-app/           # Next.js application
├── netlify/
│   └── functions/          # Serverless functions
├── shared/
│   ├── types/             # TypeScript definitions
│   ├── services/          # Business logic
│   └── validation/        # Zod schemas
└── package.json           # Root configuration
```

## 🛠 Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Netlify Functions v2, TypeScript
- **Forms**: React Hook Form, Zod validation
- **Storage**: Netlify Blobs (documents), Email notifications (data)
- **Email**: Gmail SMTP via Nodemailer

## 🔧 Environment Variables

Create `.env.local` in `apps/form-app/`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8888

# Optional Services (disabled by default)

# Email Configuration
GMAIL_USER=your_gmail_account
GMAIL_APP_PASSWORD=your_app_password
HR_EMAIL=hr@wareworks.me

# Feature Flags
ENABLE_PDF_GENERATION=false
ENABLE_EMAIL_NOTIFICATIONS=false
```

## 🚢 Deployment

1. **Connect to Netlify**:
   ```bash
   netlify init
   ```

2. **Set Environment Variables** in Netlify dashboard

3. **Deploy**:
   ```bash
   git push origin main
   ```

## 🎯 Features

- ✅ Multi-step form with progress tracking
- ✅ Real-time validation with Zod schemas
- ✅ Responsive design with Tailwind CSS
- ✅ Modern Netlify Functions v2
- ✅ TypeScript throughout
- 🚧 File uploads with Netlify Blobs
- 🚧 PDF generation with filled templates
- ✅ Email-based data collection
- 🚧 Email notifications

## 🔗 Integration

### Webflow Integration
Add this to your Webflow site:
```html
<a href="https://apply.wareworks.me" class="cta-button">
  Start Your Application
</a>
```

### Domain Setup
- Marketing: `wareworks.me` (Webflow)
- Application: `apply.wareworks.me` (Netlify)

## 📝 Development

1. **Start local development**:
   ```bash
   cd apps/form-app
   npm run dev
   ```

2. **Test Netlify Functions locally**:
   ```bash
   netlify dev
   ```

3. **Access application**:
   - Frontend: http://localhost:3000
   - Functions: http://localhost:8888/.netlify/functions/

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📄 License

Private - WareWorks Internal Use Only