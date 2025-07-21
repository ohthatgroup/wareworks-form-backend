interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-primary">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm text-gray-600">
          {steps[currentStep]}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`text-xs ${
              index <= currentStep 
                ? 'text-primary font-medium' 
                : 'text-gray-400'
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  )
}