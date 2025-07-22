'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { translations, TranslationKey, Language } from '../translations'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, params?: Record<string, string | number>, fallback?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      // Read language from URL parameter (from webflow embed)
      const urlParams = new URLSearchParams(window.location.search)
      const urlLanguage = urlParams.get('lang') as Language | null
      
      if (urlLanguage && (urlLanguage === 'en' || urlLanguage === 'es')) {
        setLanguageState(urlLanguage)
      } else {
        // Fallback to localStorage
        const savedLanguage = localStorage.getItem('preferred-language') as Language
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
          setLanguageState(savedLanguage)
        }
      }
    }
  }, [hydrated])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', newLanguage)
    }
  }

  const t = (key: TranslationKey, params?: Record<string, string | number>, fallback?: string): string => {
    let translation = translations[language][key] || fallback || key
    
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