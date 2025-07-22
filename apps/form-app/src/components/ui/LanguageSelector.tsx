import { useLanguage } from '../../contexts/LanguageContext'
import { Globe, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface LanguageSelectorProps {
  variant?: 'full' | 'compact' | 'toggle' | 'landing'
  className?: string
  onContinue?: () => void
}

export function LanguageSelector({ variant = 'full', className = '', onContinue }: LanguageSelectorProps) {
  const { language, setLanguage, t, isLoaded } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'landing') {
    return (
      <div className={`text-center space-y-6 ${className}`}>
        <div>
          <h2 className="text-3xl font-bold text-primary mb-2 font-heading">
            {t('landing.title', 'Welcome to WareWorks')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('landing.language_selection.instruction', 'Please select your preferred language:')}
          </p>
        </div>
        
        {/* Language Toggle */}
        <div className="flex justify-center mb-6">
          <div className="relative bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setLanguage('en')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                language === 'en'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                language === 'es'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Español
            </button>
          </div>
        </div>
        
        {/* Privacy Notice */}
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 mb-2">
            <strong>{language === 'en' ? 'English:' : 'Inglés:'}</strong> {' '}
            {t('landing.privacy.text', 'By continuing, you acknowledge that the information you provide will be used for employment purposes and will be kept confidential according to applicable laws.')}
          </p>
          <p className="text-sm text-gray-700">
            <strong>{language === 'es' ? 'Español:' : 'Spanish:'}</strong> {' '}
            {language === 'es' 
              ? 'Al continuar, usted reconoce que la información que proporcione será utilizada para fines de empleo y se mantendrá confidencial de acuerdo con las leyes aplicables.'
              : 'Al continuar, usted reconoce que la información que proporcione será utilizada para fines de empleo y se mantendrá confidencial de acuerdo con las leyes aplicables.'
            }
          </p>
        </div>
        
        {/* Single Continue Button */}
        <button
          onClick={onContinue}
          disabled={!isLoaded}
          className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isLoaded ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </span>
          ) : (
            t('landing.language_selection.continue', 'Accept & Continue')
          )}
        </button>
      </div>
    )
  }

  if (variant === 'toggle') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Globe className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">
            {language === 'en' ? 'English' : 'Español'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-full">
            <button
              onClick={() => {
                setLanguage('en')
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                language === 'en' ? 'bg-primary text-white hover:bg-primary' : ''
              }`}
            >
              English
            </button>
            <button
              onClick={() => {
                setLanguage('es')
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                language === 'es' ? 'bg-primary text-white hover:bg-primary' : ''
              }`}
            >
              Español
            </button>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <Globe className="w-4 h-4 text-gray-500" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-primary focus:border-primary"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Globe className="w-5 h-5 text-gray-600" />
      <div className="flex space-x-2">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            language === 'en'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            language === 'es'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Español
        </button>
      </div>
    </div>
  )
}