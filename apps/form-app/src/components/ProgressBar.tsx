import { useLanguage } from '../contexts/LanguageContext'

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

  return (
    <div className="mb-4 md:mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-primary">
            {t('progress.step_indicator', { current: currentStep + 1, total: totalSteps })}
          </span>
          {/* Language Selector */}
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">{language === 'en' ? 'English' : 'Inglés'}</option>
              <option value="es">{language === 'en' ? 'Spanish' : 'Español'}</option>
            </select>
          </div>
        </div>
        <span className="text-sm text-gray-600 hidden md:block">
          {steps[currentStep]}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="w-full bg-gray-100 rounded-lg h-12 flex">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index)
            const isCurrent = index === currentStep
            const isClickable = isStepClickable(index)
            const isLast = index === steps.length - 1
            
            return (
              <div key={index} className="flex flex-1">
                <div 
                  className={`
                    group flex-1 flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out
                    ${isCurrent ? 'bg-primary' : isCompleted ? 'bg-green-500' : 'hover:bg-gray-200'}
                  `}
                  onClick={() => handleStepClick(index)}
                >
                  <span className={`font-bold text-sm transition-colors duration-300 ${
                    isCurrent || isCompleted ? 'text-white' : 'text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  
                  {isCurrent && (
                    <span className="ml-3 text-white text-sm font-medium whitespace-nowrap">
                      {step}
                    </span>
                  )}
                  
                  {!isCurrent && (
                    <span className={`
                      ml-3 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out
                      opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto
                      ${isCompleted ? 'text-white' : 'text-gray-700'}
                    `}>
                      {step}
                    </span>
                  )}
                </div>
                
                {!isLast && (
                  <div className="w-6 flex items-center justify-center bg-gray-100 h-full">
                    <span className="text-gray-400 font-bold text-2xl leading-none">/</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}