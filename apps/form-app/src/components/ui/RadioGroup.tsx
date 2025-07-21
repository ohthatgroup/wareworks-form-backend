import { UseFormRegisterReturn } from 'react-hook-form'

interface RadioOption {
  value: string
  label: string
}

interface RadioGroupProps {
  label: string
  name: string
  options: RadioOption[]
  error?: string
  registration?: UseFormRegisterReturn
  required?: boolean
  className?: string
}

export function RadioGroup({ 
  label, 
  name, 
  options, 
  error, 
  registration, 
  required,
  className = '' 
}: RadioGroupProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
        {options.map((option) => (
          <label 
            key={option.value}
            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <input
              type="radio"
              value={option.value}
              {...registration}
              className="w-4 h-4 text-primary border-gray-300 focus:ring-primary focus:ring-2 focus:ring-offset-0"
            />
            <span className="ml-3 text-sm font-medium text-gray-900 leading-tight">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  )
}