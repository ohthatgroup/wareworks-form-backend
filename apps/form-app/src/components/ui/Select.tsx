import { forwardRef } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  registration?: UseFormRegisterReturn
  required?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, registration, required, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <select
          ref={ref}
          className={`form-input ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
          {...registration}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p className="form-error">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'