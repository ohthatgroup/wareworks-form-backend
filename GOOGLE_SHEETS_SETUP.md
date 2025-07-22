# Google Sheets Service Account Setup Guide

## 🔧 What You Have
- ✅ Service Account: `webmail@wareworks-backend.iam.gserviceaccount.com`
- ✅ Google Sheets document: `1jgMtCCuntq8nA_zQTz8QWSnRd4YjevjXW2sPPQUwIy4`
- ✅ Code updated to use service account authentication

## 🚀 Quick Setup Steps

### Step 1: Download Service Account Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin > Service Accounts**
3. Click on `webmail@wareworks-backend.iam.gserviceaccount.com`
4. Go to **"Keys" tab**
5. Click **"Add Key" > "Create new key" > "JSON"**
6. Download the JSON file

### Step 2: Enable Required APIs
In Google Cloud Console, go to **APIs & Services > Library** and enable:
- ✅ **Google Sheets API**
- ✅ **Google Drive API** (needed for access)

### Step 3: Share Your Google Sheet
1. Open your sheet: https://docs.google.com/spreadsheets/d/1jgMtCCuntq8nA_zQTz8QWSnRd4YjevjXW2sPPQUwIy4/edit
2. Click **"Share"** button (top right)
3. Add email: `webmail@wareworks-backend.iam.gserviceaccount.com`
4. Set permission: **"Viewer"**
5. Click **"Send"**

### Step 4: Configure Environment Variables
Create `.env.local` file in `/apps/form-app/` with:

```bash
# Copy from your downloaded JSON file:
GOOGLE_SERVICE_ACCOUNT_EMAIL=webmail@wareworks-backend.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_FROM_JSON_FILE_HERE
-----END PRIVATE KEY-----"
GOOGLE_SHEETS_ID=1jgMtCCuntq8nA_zQTz8QWSnRd4YjevjXW2sPPQUwIy4
```

**⚠️ Important:** Replace `YOUR_PRIVATE_KEY_FROM_JSON_FILE_HERE` with the actual private key from your JSON file. Keep the quotes and newlines!

### Step 5: Test the Connection
Run the development server:
```bash
cd apps/form-app
npm run dev
```

Open browser and check console for:
- ✅ `"✅ Loaded X translations from Google Sheets via service account"`
- ❌ Any error messages about authentication

## 🔍 Troubleshooting

### Error: "Service account authentication failed"
- ✅ Check private key format in `.env.local`
- ✅ Ensure JSON file was downloaded correctly
- ✅ Verify service account email matches exactly

### Error: "Service account lacks permissions"
- ✅ Share Google Sheet with service account email
- ✅ Give at least "Viewer" permission
- ✅ Enable Google Sheets API and Google Drive API

### Error: "Google Sheets document not found"
- ✅ Check GOOGLE_SHEETS_ID matches your sheet URL
- ✅ Ensure sheet is shared with service account

### Still having issues?
1. Check browser console for detailed error messages
2. Verify your JSON key file format
3. Confirm APIs are enabled in Google Cloud Console

## 📝 How It Works

1. **Frontend** requests translations from `/api/translations`
2. **API endpoint** authenticates with Google using service account
3. **Google Sheets API** returns translation data
4. **Caching system** stores results for 24 hours
5. **Fallback system** uses local CSV if Google Sheets fails

## 🎯 Benefits of Service Account

- ✅ **No API quotas** (unlike public API keys)
- ✅ **More secure** (server-side authentication)
- ✅ **Better error handling** (detailed permission messages)
- ✅ **Production ready** (enterprise-grade authentication)

Once configured, translations will load instantly from cache, with fresh data pulled from Google Sheets daily!