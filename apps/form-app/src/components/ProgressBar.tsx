import { useLanguage } from '../contexts/LanguageContext'
import { useEffect, useRef } from 'react'

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
  const mobileScrollRef = useRef<HTMLDivElement>(null)

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

  // Auto-scroll mobile progress bar to keep current step visible
  useEffect(() => {
    if (mobileScrollRef.current) {
      const scrollContainer = mobileScrollRef.current
      const segmentWidth = 60 // 60px per segment
      const containerWidth = scrollContainer.clientWidth
      const currentStepPosition = currentStep * segmentWidth
      
      // Keep current step towards the left side (25% from left edge)
      const targetScroll = Math.max(0, currentStepPosition - (containerWidth * 0.25))
      
      scrollContainer.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }, [currentStep])

  return (
    <div className="bg-white border-b border-gray-100 mb-6">
      {/* Clean Header */}
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          {/* Step Info */}
          <div>
            <h2 className="text-sm font-semibold text-primary">
              {t('progress.step_indicator', { current: currentStep + 1, total: totalSteps })}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progress)}% {t('common.complete') || 'Complete'}
            </p>
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

        {/* Fluid Segmented Progress Bar */}
        <div className="relative">
          {/* Desktop: Full width bar */}
          <div className="hidden sm:block w-full bg-secondary rounded-full h-8 relative overflow-hidden">
            {/* Fluid Progress Fill */}
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
            
            {/* Segment Overlays */}
            <div className="absolute inset-0 flex">
              {steps.map((step, index) => {
                const state = getStepState(index)
                const isClickable = isStepClickable(index)
                const stepWidth = 100 / totalSteps
                
                return (
                  <div
                    key={index}
                    className={`
                      relative flex-1 transition-all duration-300 ease-out group
                      ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                      ${isClickable ? 'hover:bg-white/10' : ''}
                    `}
                    onClick={() => handleStepClick(index)}
                    style={{ width: `${stepWidth}%` }}
                  >
                    {/* Step Content */}
                    <div className="absolute inset-0 flex items-center justify-center px-1">
                      {/* Step Number (default visible) */}
                      <span className={`
                        text-sm font-bold group-hover:opacity-0 transition-opacity duration-200 z-10
                        ${state === 'completed' || state === 'current' || state === 'passed' ? 'text-white' : 'text-gray-600'}
                      `}>
                        {index + 1}
                      </span>
                      
                      {/* Step Name (visible on hover) */}
                      <span className={`
                        absolute inset-x-1 text-xs font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate z-10
                        ${state === 'completed' || state === 'current' || state === 'passed' ? 'text-white' : 'text-gray-600'}
                      `}>
                        {step}
                      </span>
                    </div>
                    
                    {/* Segment Divider */}
                    {index < steps.length - 1 && (
                      <div className="absolute right-0 top-0 bottom-0 w-px bg-white/30 z-20" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile: Scrollable bar with fixed width segments */}
          <div className="sm:hidden relative">
            <div 
              ref={mobileScrollRef}
              className="overflow-x-auto scrollbar-hide" 
              style={{ maxWidth: '100vw' }}
            >
              <div 
                className="bg-secondary rounded-full h-8 relative"
                style={{ 
                  width: `${steps.length * 60}px`, // 60px per segment
                  minWidth: '100%'
                }}
              >
                {/* Fluid Progress Fill */}
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
                
                {/* Segment Overlays */}
                <div className="absolute inset-0 flex">
                  {steps.map((step, index) => {
                    const state = getStepState(index)
                    const isClickable = isStepClickable(index)
                    
                    return (
                      <div
                        key={index}
                        className={`
                          relative transition-all duration-300 ease-out group
                          ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                          ${isClickable ? 'active:bg-white/10' : ''}
                        `}
                        onClick={() => handleStepClick(index)}
                        style={{ width: '60px' }}
                      >
                        {/* Step Content */}
                        <div className="absolute inset-0 flex items-center justify-center px-1">
                          {/* Step Number (always visible on mobile) */}
                          <span className={`
                            text-sm font-bold z-10
                            ${state === 'completed' || state === 'current' || state === 'passed' ? 'text-white' : 'text-gray-600'}
                          `}>
                            {index + 1}
                          </span>
                        </div>
                        
                        {/* Segment Divider */}
                        {index < steps.length - 1 && (
                          <div className="absolute right-0 top-0 bottom-0 w-px bg-white/30 z-20" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}