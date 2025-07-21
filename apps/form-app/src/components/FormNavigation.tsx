import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

interface FormNavigationProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
  isSubmitting: boolean
  canProceed: boolean
}

export function FormNavigation({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onSubmit,
  isSubmitting,
  canProceed 
}: FormNavigationProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
        className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
          isFirstStep || isSubmitting
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <ChevronLeft size={20} />
        Previous
      </button>

      {isLastStep ? (
        <button
          type="submit"
          disabled={!canProceed || isSubmitting}
          onClick={onSubmit}
          className={`flex items-center gap-2 px-8 py-3 rounded-md font-medium transition-colors ${
            !canProceed || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-hover'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Application
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
            !canProceed || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-hover'
          }`}
        >
          Next
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  )
}