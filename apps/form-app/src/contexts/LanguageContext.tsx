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

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      // Check if we're in an iframe
      const isInIframe = window.self !== window.top
      
      // Read language from URL parameter (from webflow embed)
      const urlParams = new URLSearchParams(window.location.search)
      const urlLanguage = urlParams.get('lang') as Language | null
      const savedLanguage = sessionStorage.getItem('preferred-language') as Language
      
      // Priority 1: URL parameter (highest priority - overrides saved preference)
      if (urlLanguage && (urlLanguage === 'en' || urlLanguage === 'es')) {
        setLanguageState(urlLanguage)
        sessionStorage.setItem('preferred-language', urlLanguage)
      } 
      // Priority 2: User's saved preference
      else if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
        setLanguageState(savedLanguage)
      }
      // Priority 3: Default to English for new users
      else {
        setLanguageState('en')
        sessionStorage.setItem('preferred-language', 'en')
      }

      // Set up cross-frame communication for language synchronization
      if (isInIframe) {
        const handleMessage = (event: MessageEvent) => {
          // Security: Only accept messages from trusted origins
          const allowedOrigins = [
            'https://wareworks.me',
            'https://www.wareworks.me',
            'https://wareworks.webflow.io',
            window.location.origin
          ]
          
          if (!allowedOrigins.includes(event.origin)) {
            return
          }

          if (event.data.type === 'languageChange' && event.data.language) {
            const newLang = event.data.language as Language
            if (newLang === 'en' || newLang === 'es') {
              setLanguageState(newLang)
              sessionStorage.setItem('preferred-language', newLang)
            }
          }
        }

        window.addEventListener('message', handleMessage)
        
        // Send current language to parent on load
        try {
          window.parent.postMessage({
            type: 'iframeLanguageUpdate',
            language: language
          }, '*')
        } catch (error) {
          console.warn('Could not communicate with parent window:', error)
        }

        return () => {
          window.removeEventListener('message', handleMessage)
        }
      }
    }
  }, [hydrated, language])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    
    if (hydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('preferred-language', newLanguage)
      
      // If we're in an iframe, notify the parent of the language change
      try {
        if (window.self !== window.top) {
          window.parent.postMessage({
            type: 'iframeLanguageUpdate',
            language: newLanguage
          }, '*')
        }
      } catch (error) {
        console.warn('Could not communicate language change to parent window:', error)
      }
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