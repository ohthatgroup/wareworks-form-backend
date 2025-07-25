'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { translations, TranslationKey, Language } from '../translations'

// Create a more flexible translation function type
type TranslationFunction = {
  (key: TranslationKey): string;
  (key: string): string;
}

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: TranslationFunction & ((key: string, params?: Record<string, string | number>, fallback?: string) => string)
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [hydrated, setHydrated] = useState(false)
  
  console.log('LanguageProvider initialized with language:', language)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      // Read language from URL parameter (from webflow embed)
      const urlParams = new URLSearchParams(window.location.search)
      const urlLanguage = urlParams.get('lang') as Language | null
      const savedLanguage = localStorage.getItem('preferred-language') as Language
      
      console.log('Language detection:', {
        urlLanguage,
        savedLanguage,
        currentLanguage: language,
        url: window.location.href
      })
      
      // Priority 1: URL parameter (highest priority - overrides saved preference)
      if (urlLanguage && (urlLanguage === 'en' || urlLanguage === 'es')) {
        console.log('Setting language from URL parameter:', urlLanguage)
        setLanguageState(urlLanguage)
        localStorage.setItem('preferred-language', urlLanguage)
      } 
      // Priority 2: User's saved preference
      else if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
        console.log('Using saved language preference:', savedLanguage)
        setLanguageState(savedLanguage)
      }
      // Priority 3: Default to English for new users
      else {
        console.log('New user - defaulting to English')
        setLanguageState('en')
        localStorage.setItem('preferred-language', 'en')
      }
    }
  }, [hydrated])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', newLanguage)
    }
  }

  const t = (key: string, params?: Record<string, string | number>, fallback?: string): string => {
    let translation: string = translations[language][key as TranslationKey] || fallback || key
    
    // Handle parameter interpolation
    if (params && typeof translation === 'string') {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
      })
    }
    
    return translation
  }

  // Memoize context value to ensure re-renders only when language changes
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language])

  return (
    <LanguageContext.Provider value={contextValue}>
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

export const useTranslation = useLanguage