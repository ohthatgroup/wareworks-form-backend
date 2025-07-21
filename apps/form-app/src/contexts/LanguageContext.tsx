'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { translationService } from '../services/TranslationService'

interface LanguageContextType {
  language: 'en' | 'es'
  setLanguage: (language: 'en' | 'es') => void
  t: (key: string, fallback?: string) => string
  translate: (key: string, params?: Record<string, string | number>, fallback?: string) => string
  isLoaded: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'es'>('en')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load translations on mount
    translationService.loadTranslations().then(() => {
      setIsLoaded(true)
    }).catch(error => {
      console.error('Failed to load translations:', error)
      setIsLoaded(true) // Still set loaded to true to prevent infinite loading
    })
  }, [])

  useEffect(() => {
    // Load saved language preference from localStorage after hydration
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferred-language') as 'en' | 'es'
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  useEffect(() => {
    // Listen for language changes from parent window (embed)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'language_change') {
        const newLanguage = event.data.language as 'en' | 'es'
        if (newLanguage && (newLanguage === 'en' || newLanguage === 'es')) {
          setLanguage(newLanguage)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const setLanguage = (newLanguage: 'en' | 'es') => {
    setLanguageState(newLanguage)
    translationService.setLanguage(newLanguage)
    
    // Save preference to localStorage
    localStorage.setItem('preferred-language', newLanguage)
    
    // Also save to form data if available (for iframe communication)
    try {
      const event = new CustomEvent('languageChanged', {
        detail: { language: newLanguage }
      })
      window.dispatchEvent(event)
    } catch (error) {
      // Ignore errors in iframe context
    }
  }

  const t = (key: string, fallback?: string): string => {
    return translationService.t(key, fallback)
  }

  const translate = (key: string, params?: Record<string, string | number>, fallback?: string): string => {
    return translationService.translate(key, params, fallback)
  }

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      translate,
      isLoaded
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Convenience hook that's the same as useLanguage but shorter name
export const useTranslation = useLanguage