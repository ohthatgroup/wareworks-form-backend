import { useLanguage } from '../../contexts/LanguageContext'
import { Globe } from 'lucide-react'

interface LanguageSelectorProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function LanguageSelector({ variant = 'full', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage()

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