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
              className={`group ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => handleStepClick(index)}
            >
              <div 
                className={`
                  h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
                  ${isCurrent 
                    ? 'bg-primary text-white px-3 gap-2' 
                    : isCompleted
                    ? 'bg-green-500 text-white w-8 group-hover:px-3 group-hover:gap-2'
                    : 'bg-gray-200 text-gray-600 w-8 group-hover:px-3 group-hover:gap-2 hover:bg-gray-300'
                  }
                `}
              >
                {isCompleted ? '✓' : index + 1}
                {isCurrent && step}
                {!isCurrent && <span className="opacity-0 group-hover:opacity-100">{step}</span>}
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}