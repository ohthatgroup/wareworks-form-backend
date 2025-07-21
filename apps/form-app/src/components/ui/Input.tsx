import { forwardRef } from 'react'
import { UseFormRegisterReturn } from 'react-hook-form'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  registration?: UseFormRegisterReturn
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, registration, required, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <input
          ref={ref}
          className={`form-input ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
          {...registration}
          {...props}
        />
        
        {error && (
          <p className="form-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'