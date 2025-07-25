'use client'

import { useLanguage } from '../contexts/LanguageContext'

export function LanguageDebug() {
  const { language, setLanguage } = useLanguage()
  
  const clearLanguagePreferences = () => {
    localStorage.removeItem('preferred-language')
    localStorage.setItem('preferred-language', 'en')
    setLanguage('en')
    console.log('Language preferences cleared, set to English')
    window.location.reload() // Force page reload to ensure clean state
  }
  
  const forceEnglish = () => {
    localStorage.setItem('preferred-language', 'en')
    setLanguage('en')
    console.log('Forced language to English')
  }
  
  const checkCurrentSettings = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlLanguage = urlParams.get('lang')
    const savedLanguage = localStorage.getItem('preferred-language')
    
    console.log('Language Debug Info:', {
      currentLanguage: language,
      urlLanguage,
      savedLanguage,
      url: window.location.href
    })
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50">
      <div className="text-sm space-y-2">
        <div><strong>Current Language:</strong> {language}</div>
        <div className="space-x-2">
          <button 
            onClick={forceEnglish} 
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Force English
          </button>
          <button 
            onClick={() => setLanguage('es')} 
            className="px-2 py-1 bg-green-500 text-white rounded text-xs"
          >
            Set Spanish
          </button>
        </div>
        <div className="space-x-2">
          <button 
            onClick={clearLanguagePreferences} 
            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
          >
            Clear & Reset
          </button>
          <button 
            onClick={checkCurrentSettings} 
            className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
          >
            Debug Info
          </button>
        </div>
      </div>
    </div>
  )
}