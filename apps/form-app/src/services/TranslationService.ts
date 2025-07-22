import React from 'react'

interface TranslationEntry {
  key: string
  context: string
  file_location: string
  english_text: string
  spanish_text: string
}

interface TranslationData {
  [key: string]: {
    en: string
    es: string
    context?: string
  }
}

class TranslationService {
  private translations: TranslationData = {}
  private currentLanguage: 'en' | 'es' = 'en'
  private isLoaded = false
  private loadPromise: Promise<void> | null = null
  private cacheKey = 'wareworks_translations_cache'
  private cacheVersionKey = 'wareworks_translations_version'
  private currentVersion = '1.0.0' // Increment when translations change

  async loadTranslations(): Promise<void> {
    // Prevent multiple simultaneous loads
    if (this.loadPromise) return this.loadPromise
    if (this.isLoaded) return

    this.loadPromise = this.doLoadTranslations()
    return this.loadPromise
  }

  private async doLoadTranslations(): Promise<void> {
    try {
      // First try to load from cache
      if (await this.loadFromCache()) {
        console.log('Translations loaded from cache')
        this.isLoaded = true
        return
      }

      // Try Google Sheets with timeout and retry
      try {
        await this.loadFromGoogleSheetsWithRetry()
        await this.saveToCache() // Cache successful load
      } catch (error) {
        console.warn('Failed to load from Google Sheets, falling back to local CSV:', error)
        // Fallback to local CSV
        await this.loadFromLocalCSV()
        await this.saveToCache() // Cache fallback load
      }

      this.isLoaded = true
    } catch (error) {
      console.error('Failed to load translations:', error)
      // Load minimal fallback translations
      this.loadFallbackTranslations()
      this.isLoaded = true
    }
  }

  private async loadFromCache(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false
      
      const cachedVersion = localStorage.getItem(this.cacheVersionKey)
      const cachedData = localStorage.getItem(this.cacheKey)
      
      if (cachedVersion === this.currentVersion && cachedData) {
        const parsed = JSON.parse(cachedData)
        this.translations = parsed.translations
        const cacheAge = Date.now() - parsed.timestamp
        
        // Cache valid for 24 hours
        if (cacheAge < 24 * 60 * 60 * 1000) {
          return true
        }
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error)
    }
    return false
  }

  private async saveToCache(): Promise<void> {
    try {
      if (typeof window === 'undefined') return
      
      const cacheData = {
        translations: this.translations,
        timestamp: Date.now()
      }
      
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData))
      localStorage.setItem(this.cacheVersionKey, this.currentVersion)
    } catch (error) {
      console.warn('Failed to save to cache:', error)
    }
  }

  private loadFallbackTranslations(): void {
    // Minimal fallback translations for critical UI elements
    this.translations = {
      'landing.title': { en: 'Welcome to WareWorks', es: 'Bienvenido a WareWorks' },
      'landing.language_selection.instruction': { en: 'Please select your preferred language:', es: 'Por favor seleccione su idioma preferido:' },
      'landing.language_selection.continue': { en: 'Accept & Continue', es: 'Aceptar y Continuar' },
      'steps.personal_info.title': { en: 'Personal Information', es: 'Información Personal' },
      'steps.contact.title': { en: 'Contact Details', es: 'Detalles de Contacto' },
      'steps.citizenship.title': { en: 'Work Authorization', es: 'Autorización de Trabajo' },
      'steps.position.title': { en: 'Position & Experience', es: 'Posición y Experiencia' },
      'steps.availability.title': { en: 'Availability', es: 'Disponibilidad' },
      'steps.education_employment.title': { en: 'Education & Employment', es: 'Educación y Empleo' },
      'steps.documents.title': { en: 'Documents', es: 'Documentos' },
      'steps.review.title': { en: 'Review & Submit', es: 'Revisar y Enviar' }
    }
  }

  private async loadFromGoogleSheetsWithRetry(): Promise<void> {
    const maxRetries = 2
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.loadFromGoogleSheets()
        return
      } catch (error) {
        lastError = error as Error
        console.warn(`Google Sheets attempt ${attempt}/${maxRetries} failed:`, error)
        
        if (attempt < maxRetries) {
          // Wait with exponential backoff: 1s, 2s
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }
    
    throw lastError
  }

  private async loadFromGoogleSheets(): Promise<void> {
    // Try API key method first (simpler), then fall back to service account
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
    
    if (apiKey) {
      console.log('🔑 Using Google Sheets API key method')
      await this.loadFromGoogleSheetsAPI()
    } else {
      console.log('🔐 Using service account method')
      await this.loadFromServiceAccount()
    }
  }

  private async loadFromServiceAccount(): Promise<void> {
    // Use our API endpoint that handles service account authentication
    const url = '/api/translations'
    
    // Reduced timeout for better UX
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = `Translation API error (${response.status})`
        
        if (response.status === 401) {
          errorMessage = 'Service account authentication failed'
        } else if (response.status === 403) {
          errorMessage = 'Service account lacks permissions - check sheet sharing with webmail@wareworks-backend.iam.gserviceaccount.com'
        } else if (response.status === 404) {
          errorMessage = 'Google Sheets document not found'
        } else if (response.status === 500) {
          errorMessage = errorData.error || 'Service account configuration error'
        }
        
        // Log detailed error in development
        if (process.env.NODE_ENV === 'development' && errorData.details) {
          console.error('Detailed error:', errorData.details)
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data.values || !Array.isArray(data.values)) {
        throw new Error('Invalid Google Sheets response format')
      }
      
      console.log(`✅ Loaded ${data.values.length - 1} translations from Google Sheets via service account`)
      this.parseCSVData(data.values)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Google Sheets request timed out')
      }
      throw error
    }
  }

  private async loadFromGoogleSheetsAPI(): Promise<void> {
    const SHEET_ID = '1jgMtCCuntq8nA_zQTz8QWSnRd4YjevjXW2sPPQUwIy4'
    const SHEET_NAME = 'Sheet1'
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
    
    // Reduced timeout for better UX
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        let errorMessage = `Google Sheets API error (${response.status})`
        
        if (response.status === 400) {
          errorMessage = 'Invalid Google Sheets API key or configuration'
        } else if (response.status === 403) {
          errorMessage = 'Google Sheets API key invalid or quota exceeded'
        } else if (response.status === 404) {
          errorMessage = 'Google Sheets document not found or not public'
        } else if (response.status === 429) {
          errorMessage = 'Google Sheets API rate limit exceeded'
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data.values || !Array.isArray(data.values)) {
        throw new Error('Invalid Google Sheets response format')
      }
      
      console.log(`✅ Loaded ${data.values.length - 1} translations from Google Sheets via API key`)
      this.parseCSVData(data.values)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Google Sheets request timed out')
      }
      throw error
    }
  }

  private async loadFromLocalCSV(): Promise<void> {
    // For development/fallback, load from local CSV
    const response = await fetch('/wareworks-translations.csv')
    if (!response.ok) {
      throw new Error('Failed to load local translations')
    }

    const csvText = await response.text()
    const rows = this.parseCSVText(csvText)
    this.parseCSVData(rows)
  }

  private parseCSVText(csvText: string): string[][] {
    const rows: string[][] = []
    const lines = csvText.split('\n')
    
    for (const line of lines) {
      if (line.trim() === '') continue
      
      const columns: string[] = []
      let current = ''
      let inQuotes = false
      let i = 0
      
      while (i < line.length) {
        const char = line[i]
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped quote
            current += '"'
            i += 2
          } else {
            // Toggle quote state
            inQuotes = !inQuotes
            i++
          }
        } else if (char === ',' && !inQuotes) {
          // End of column
          columns.push(current.trim())
          current = ''
          i++
        } else {
          current += char
          i++
        }
      }
      
      // Add the last column
      columns.push(current.trim())
      rows.push(columns)
    }
    
    return rows
  }

  private parseCSVData(rows: string[][]): void {
    // Skip header row
    const dataRows = rows.slice(1)

    dataRows.forEach(row => {
      if (row.length >= 5) {
        const [key, context, file_location, english_text, spanish_text] = row
        
        if (key && english_text) {
          // Clean the key (remove .en/.es suffixes for base key)
          const baseKey = key.replace(/\.(en|es)$/, '')
          
          if (!this.translations[baseKey]) {
            this.translations[baseKey] = {
              en: '',
              es: '',
              context
            }
          }

          // Determine language from key suffix
          if (key.endsWith('.en')) {
            this.translations[baseKey].en = english_text
          } else if (key.endsWith('.es')) {
            this.translations[baseKey].es = spanish_text || english_text // Fallback to English if Spanish is empty
          } else {
            // Key without language suffix - use as English and set Spanish if provided
            this.translations[baseKey].en = english_text
            if (spanish_text && spanish_text.trim()) {
              this.translations[baseKey].es = spanish_text
            } else {
              this.translations[baseKey].es = english_text // Fallback to English
            }
          }
        }
      }
    })

    console.log(`Loaded ${Object.keys(this.translations).length} translation entries`)
    
    // Debug: log some key translations
    console.log('Sample translations:', {
      'steps.contact.title': this.translations['steps.contact.title'],
      'steps.personal_info.title': this.translations['steps.personal_info.title']
    })
  }

  setLanguage(language: 'en' | 'es'): void {
    this.currentLanguage = language
  }

  getLanguage(): 'en' | 'es' {
    return this.currentLanguage
  }

  t(key: string, fallback?: string): string {
    if (!this.isLoaded) {
      console.warn('Translations not loaded yet, using fallback')
      return fallback || key
    }

    const translation = this.translations[key]
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`)
      return fallback || key
    }

    const text = translation[this.currentLanguage]
    if (!text) {
      // Fallback to English if current language not available
      const fallbackText = translation.en
      if (!fallbackText) {
        console.warn(`No translation available for key: ${key}`)
        return fallback || key
      }
      return fallbackText
    }

    return text
  }

  // Convenience method for getting translations with interpolation
  translate(key: string, params?: Record<string, string | number>, fallback?: string): string {
    let text = this.t(key, fallback)

    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value))
      })
    }

    return text
  }

  // Get all available translation keys (for debugging)
  getAvailableKeys(): string[] {
    return Object.keys(this.translations)
  }

  // Check if translations are loaded
  isReady(): boolean {
    return this.isLoaded
  }

  // Preload translations in background (non-blocking)
  preloadTranslations(): void {
    // Don't block, just start loading if not already loaded
    if (!this.isLoaded && !this.loadPromise) {
      this.loadTranslations().catch(error => {
        console.warn('Background translation preload failed:', error)
      })
    }
  }

  // Clear cache (useful for development/testing)
  clearCache(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.cacheKey)
      localStorage.removeItem(this.cacheVersionKey)
    }
  }

  // Get cache info for debugging
  getCacheInfo(): { version: string | null, age: number | null, size: number | null } {
    if (typeof window === 'undefined') return { version: null, age: null, size: null }
    
    const version = localStorage.getItem(this.cacheVersionKey)
    const cacheData = localStorage.getItem(this.cacheKey)
    
    let age = null
    let size = null
    
    if (cacheData) {
      try {
        const parsed = JSON.parse(cacheData)
        age = Date.now() - parsed.timestamp
        size = new Blob([cacheData]).size
      } catch (error) {
        // ignore
      }
    }
    
    return { version, age, size }
  }
}

// Create singleton instance
export const translationService = new TranslationService()

// Removed duplicate hook - use LanguageContext instead

export default translationService