import { useLanguage } from '@/contexts/LanguageContext'

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
    <div className="mb-4 md:mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-primary">
          {t('progress.step_indicator', { current: currentStep + 1, total: totalSteps })}
        </span>
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