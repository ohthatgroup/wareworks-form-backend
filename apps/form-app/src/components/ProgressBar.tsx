import { useLanguage } from '../contexts/LanguageContext'
import { Check, ChevronRight } from 'lucide-react'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  steps: string[]
  onStepClick?: (stepIndex: number) => void
  completedSteps?: number[]
}

export function ProgressBar({ 
  currentStep, 
  totalSteps, 
  steps, 
  onStepClick,
  completedSteps = []
}: ProgressBarProps) {
  const { t, language, setLanguage } = useLanguage()
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleStepClick = (stepIndex: number) => {
    if (onStepClick && (stepIndex <= currentStep || completedSteps.includes(stepIndex))) {
      onStepClick(stepIndex)
    }
  }

  const isStepClickable = (stepIndex: number) => {
    return onStepClick && (stepIndex <= currentStep || completedSteps.includes(stepIndex))
  }

  const getStepState = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed'
    if (stepIndex === currentStep) return 'current'
    if (stepIndex < currentStep) return 'passed'
    return 'future'
  }

  return (
    <div className="bg-white border-b border-gray-100 mb-6">
      {/* Header Section */}
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* App Branding & Step Info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm font-heading">W</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-primary font-heading">
                WareWorks
              </h1>
              <p className="text-xs text-gray-500 font-body">
                {t('progress.step_indicator', { current: currentStep + 1, total: totalSteps })}
              </p>
            </div>
          </div>

          {/* Language Selector & Current Step */}
          <div className="flex items-center space-x-4">
            {/* Current Step Info (Desktop) */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">{steps[currentStep]}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-primary focus:border-primary"
              >
                <option value="en">{language === 'en' ? 'English' : 'Inglés'}</option>
                <option value="es">{language === 'en' ? 'Spanish' : 'Español'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              {Math.round(progress)}% {t('common.complete') || 'Complete'}
            </span>
            <span className="text-xs text-gray-400">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>
          
          {/* Main Progress Line */}
          <div className="relative">
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-primary-hover h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="px-4 pb-4 sm:px-6">
        <div className="grid grid-cols-4 sm:flex sm:justify-between gap-1 sm:gap-2">
          {steps.map((step, index) => {
            const state = getStepState(index)
            const isClickable = isStepClickable(index)
            
            return (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                disabled={!isClickable}
                className={`
                  group flex flex-col items-center p-2 rounded-lg transition-all duration-200 min-w-0
                  ${isClickable ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                  ${state === 'current' ? 'bg-primary/5' : ''}
                `}
                title={step}
              >
                {/* Step Circle */}
                <div className={`
                  relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all duration-200
                  ${state === 'completed' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : state === 'current'
                    ? 'bg-primary text-white shadow-lg ring-4 ring-primary/20'
                    : state === 'passed'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable && state !== 'current' ? 'group-hover:scale-110 group-hover:shadow-md' : ''}
                `}>
                  {state === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                  
                  {/* Current Step Pulse */}
                  {state === 'current' && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                  )}
                </div>

                {/* Step Label */}
                <span className={`
                  text-xs text-center leading-tight max-w-full font-body
                  ${state === 'current' || state === 'completed'
                    ? 'text-primary font-semibold' 
                    : state === 'passed'
                    ? 'text-gray-700 font-medium'
                    : 'text-gray-400'
                  }
                  ${isClickable ? 'group-hover:text-primary' : ''}
                `}>
                  {/* Mobile: Show abbreviated text */}
                  <span className="sm:hidden block truncate max-w-[60px]">
                    {step.split(' ')[0]}
                  </span>
                  {/* Desktop: Show full text */}
                  <span className="hidden sm:block truncate max-w-[100px]">
                    {step}
                  </span>
                </span>

                {/* Active Step Indicator */}
                {state === 'current' && (
                  <div className="mt-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Current Step Display */}
      <div className="sm:hidden px-4 pb-3 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-2 py-2">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <span className="text-sm font-medium text-primary font-body">
            {steps[currentStep]}
          </span>
          <div className="w-2 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </div>
  )
}