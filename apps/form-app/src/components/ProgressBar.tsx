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
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Horizontally Scrollable Step Indicators */}
      <div className="md:overflow-visible overflow-x-auto scrollbar-hide">
        <div className="flex justify-between min-w-max md:min-w-0 px-2 md:px-0" style={{minWidth: '600px'}}>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index)
          const isCurrent = index === currentStep
          const isClickable = isStepClickable(index)
          
          return (
            <div 
              key={index}
              className={`flex items-center relative group ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => handleStepClick(index)}
            >
              {/* Step Circle */}
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 relative z-10 flex-shrink-0
                  ${isCurrent 
                    ? 'bg-primary text-white shadow-lg scale-110' 
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }
                  ${isClickable ? 'hover:scale-125 hover:shadow-lg' : ''}
                `}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              
              {/* Step Label - Only show for current step or on hover */}
              {(isCurrent || false) && (
                <span 
                  className={`
                    ml-2 text-xs leading-tight transition-all duration-200 whitespace-nowrap
                    ${isCurrent 
                      ? 'text-primary font-bold' 
                      : 'text-gray-500 opacity-0 group-hover:opacity-100'
                    }
                  `}
                >
                  {step}
                </span>
              )}
              
              {/* Hover label for non-current steps */}
              {!isCurrent && (
                <span 
                  className="ml-2 text-xs leading-tight transition-all duration-200 whitespace-nowrap text-gray-500 opacity-0 group-hover:opacity-100"
                >
                  {step}
                </span>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}