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
    
    // Add timeout and error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        let errorMessage = `Google Sheets API error (${response.status})`
        
        if (response.status === 400) {
          errorMessage = 'Invalid Google Sheets configuration'
        } else if (response.status === 403) {
          errorMessage = 'Google Sheets API key invalid or quota exceeded'
        } else if (response.status === 404) {
          errorMessage = 'Google Sheets document not found'
        } else if (response.status === 429) {
          errorMessage = 'Google Sheets API rate limit exceeded'
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data.values || !Array.isArray(data.values)) {
        throw new Error('Invalid Google Sheets response format')
      }
      
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
}

// Create singleton instance
export const translationService = new TranslationService()

// Removed duplicate hook - use LanguageContext instead

export default translationService