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
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-primary">
          {t('progress.step_indicator', { current: currentStep + 1, total: totalSteps })}
        </span>
        <span className="text-sm text-gray-600">
          {steps[currentStep]}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Clickable Step Indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index)
          const isCurrent = index === currentStep
          const isClickable = isStepClickable(index)
          
          return (
            <div 
              key={index}
              className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => handleStepClick(index)}
            >
              {/* Step Circle */}
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-2 transition-all duration-200
                  ${isCurrent 
                    ? 'bg-primary text-white ring-4 ring-primary/20' 
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : index < currentStep
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                  ${isClickable ? 'hover:scale-110 hover:shadow-md' : ''}
                `}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              
              {/* Step Label */}
              <span 
                className={`
                  text-xs text-center max-w-20 leading-tight
                  ${isCurrent || isCompleted
                    ? 'text-primary font-medium' 
                    : index < currentStep
                    ? 'text-gray-700'
                    : 'text-gray-400'
                  }
                  ${isClickable ? 'hover:text-primary' : ''}
                `}
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