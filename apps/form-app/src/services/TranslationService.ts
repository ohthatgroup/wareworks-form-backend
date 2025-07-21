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

  async loadTranslations(): Promise<void> {
    if (this.isLoaded) return

    try {
      // First try to load from Google Sheets
      await this.loadFromGoogleSheets()
    } catch (error) {
      console.warn('Failed to load from Google Sheets, falling back to local CSV:', error)
      // Fallback to local CSV
      await this.loadFromLocalCSV()
    }

    this.isLoaded = true
  }

  private async loadFromGoogleSheets(): Promise<void> {
    const SHEET_ID = '1jgMtCCuntq8nA_zQTz8QWSnRd4YjevjXW2sPPQUwIy4'
    const SHEET_NAME = 'Sheet1' // Default sheet name
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY

    if (!API_KEY) {
      throw new Error('Google Sheets API key not configured')
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`)
    }

    const data = await response.json()
    this.parseCSVData(data.values)
  }

  private async loadFromLocalCSV(): Promise<void> {
    // For development/fallback, load from local CSV
    const response = await fetch('/wareworks-translations.csv')
    if (!response.ok) {
      throw new Error('Failed to load local translations')
    }

    const csvText = await response.text()
    const rows = csvText.split('\n').map(row => {
      // Simple CSV parsing (for production, use a proper CSV parser)
      const cols = row.split(',')
      return cols.map(col => col.replace(/^"(.*)"$/, '$1')) // Remove quotes
    })

    this.parseCSVData(rows)
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

          // Determine language from key suffix or content
          if (key.endsWith('.en') || !key.endsWith('.es')) {
            this.translations[baseKey].en = english_text
          }
          if (key.endsWith('.es') && spanish_text) {
            this.translations[baseKey].es = spanish_text
          }
        }
      }
    })

    console.log(`Loaded ${Object.keys(this.translations).length} translation entries`)
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
}

// Create singleton instance
export const translationService = new TranslationService()

// React hook for using translations
export function useTranslation() {
  const [isReady, setIsReady] = React.useState(translationService.isReady())
  const [language, setLanguage] = React.useState(translationService.getLanguage())

  React.useEffect(() => {
    translationService.loadTranslations().then(() => {
      setIsReady(true)
    })
  }, [])

  const changeLanguage = (newLanguage: 'en' | 'es') => {
    translationService.setLanguage(newLanguage)
    setLanguage(newLanguage)
  }

  const t = (key: string, fallback?: string) => {
    return translationService.t(key, fallback)
  }

  const translate = (key: string, params?: Record<string, string | number>, fallback?: string) => {
    return translationService.translate(key, params, fallback)
  }

  return {
    t,
    translate,
    language,
    changeLanguage,
    isReady
  }
}

export default translationService