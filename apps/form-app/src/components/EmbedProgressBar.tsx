'use client'

import { useLanguage } from '../contexts/LanguageContext'

interface EmbedProgressBarProps {
  currentStep: number
  totalSteps: number
  steps: string[]
  onStepClick?: (stepIndex: number) => void
  completedSteps?: number[]
  language: 'en' | 'es'
  onLanguageChange: (language: 'en' | 'es') => void
}

export function EmbedProgressBar({ 
  currentStep, 
  totalSteps, 
  steps, 
  onStepClick,
  completedSteps = [],
  language,
  onLanguageChange
}: EmbedProgressBarProps) {
  const { t } = useLanguage()
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleStepClick = (stepIndex: number) => {
    if (onStepClick && (stepIndex <= currentStep || completedSteps.includes(stepIndex))) {
      onStepClick(stepIndex)
    }
  }

  const isStepClickable = (stepIndex: number) => {
    return onStepClick && (stepIndex <= currentStep || completedSteps.includes(stepIndex))
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 mb-4" style={{
      fontFamily: "'Figtree', sans-serif"
    }}>
      {/* Header with Language Selector */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('embed.app_title')}</h3>
            <p className="text-xs text-gray-500">
              {t('progress.step_indicator', { current: currentStep + 1, total: totalSteps })} • {steps[currentStep]}
            </p>
          </div>
        </div>
        
        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as 'en' | 'es')}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">{t('embed.language_english')}</option>
              <option value="es">{t('embed.language_spanish')}</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Clickable Step Indicators */}
      <div className="flex justify-between overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index)
          const isCurrent = index === currentStep
          const isClickable = isStepClickable(index)
          
          return (
            <div 
              key={index}
              className={`flex flex-col items-center min-w-0 flex-1 ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => handleStepClick(index)}
              title={step}
            >
              {/* Step Circle */}
              <div 
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 transition-all duration-200
                  ${isCurrent 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' 
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : index < currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable ? 'hover:scale-110 hover:shadow-md' : ''}
                `}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              
              {/* Step Label - Truncated for mobile */}
              <span 
                className={`
                  text-xs text-center leading-tight max-w-full truncate px-1
                  ${isCurrent || isCompleted
                    ? 'text-blue-600 font-medium' 
                    : index < currentStep
                    ? 'text-gray-700'
                    : 'text-gray-400'
                  }
                  ${isClickable ? 'hover:text-blue-600' : ''}
                `}
                style={{ fontSize: '10px', maxWidth: '60px' }}
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Create a standalone version that can be rendered outside React
export function createEmbedProgressBarHTML(props: EmbedProgressBarProps) {
  const { currentStep, totalSteps, steps, completedSteps = [], language } = props
  const progress = ((currentStep + 1) / totalSteps) * 100
  
  return `
    <div id="wareworks-progress-bar" class="bg-white border-b border-gray-200 px-4 py-4 mb-4" style="font-family: 'Figtree', sans-serif;">
      <!-- Header with Language Selector -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">W</span>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900">${language === 'en' ? 'WareWorks Application' : 'Aplicación WareWorks'}</h3>
            <p class="text-xs text-gray-500">
              ${language === 'en' ? `Step ${currentStep + 1} of ${totalSteps}` : `Paso ${currentStep + 1} de ${totalSteps}`} • ${steps[currentStep]}
            </p>
          </div>
        </div>
        
        <!-- Language Selector -->
        <div class="flex items-center space-x-2">
          <select id="language-selector" class="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500">
            <option value="en" ${language === 'en' ? 'selected' : ''}>${language === 'en' ? 'English' : 'Inglés'}</option>
            <option value="es" ${language === 'es' ? 'selected' : ''}>${language === 'en' ? 'Spanish' : 'Español'}</option>
          </select>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          class="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-300 ease-out"
          style="width: ${progress}%"
        ></div>
      </div>
      
      <!-- Step Indicators -->
      <div class="flex justify-between overflow-x-auto pb-2">
        ${steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index)
          const isCurrent = index === currentStep
          const isClickable = index <= currentStep || completedSteps.includes(index)
          
          return `
            <div class="flex flex-col items-center min-w-0 flex-1 ${isClickable ? 'cursor-pointer' : ''}" 
                 onclick="${isClickable ? `navigateToStep(${index})` : ''}"
                 title="${step}">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 transition-all duration-200
                          ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' 
                            : isCompleted ? 'bg-green-500 text-white'
                            : index < currentStep ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'}
                          ${isClickable ? 'hover:scale-110 hover:shadow-md' : ''}">
                ${isCompleted ? '✓' : index + 1}
              </div>
              <span class="text-xs text-center leading-tight max-w-full truncate px-1
                           ${isCurrent || isCompleted ? 'text-blue-600 font-medium'
                             : index < currentStep ? 'text-gray-700'
                             : 'text-gray-400'}
                           ${isClickable ? 'hover:text-blue-600' : ''}"
                    style="font-size: 10px; max-width: 60px;">
                ${step}
              </span>
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}