import { useEffect, useState } from 'react'
import { LanguageSelector } from './ui/LanguageSelector'
import { useLanguage } from '../contexts/LanguageContext'
import { translationService } from '../services/TranslationService'

interface LandingPageProps {
  onContinue: () => void
}

export function LandingPage({ onContinue }: LandingPageProps) {
  const { isLoaded } = useLanguage()
  const [cacheInfo, setCacheInfo] = useState<{ version: string | null, age: number | null, size: number | null }>({ version: null, age: null, size: null })

  useEffect(() => {
    // Start preloading translations in background
    translationService.preloadTranslations()
    
    // Get cache info for debugging (remove in production)
    setCacheInfo(translationService.getCacheInfo())
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <LanguageSelector 
            variant="landing" 
            onContinue={onContinue}
          />
          
          {/* Debug info (remove in production) */}
          {process.env.NODE_ENV === 'development' && cacheInfo.version && (
            <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
              <div>Cache: v{cacheInfo.version}</div>
              <div>Age: {cacheInfo.age ? Math.round(cacheInfo.age / 1000 / 60) : 0}min</div>
              <div>Size: {cacheInfo.size ? Math.round(cacheInfo.size / 1024) : 0}KB</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}