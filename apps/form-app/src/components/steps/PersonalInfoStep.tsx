import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'

interface PersonalInfoStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function PersonalInfoStep({ form }: PersonalInfoStepProps) {
  const { register, formState: { errors }, setValue, watch } = form
  
  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as XXX-XX-XXXX
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`
    }
  }


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Legal First Name"
          registration={register('legalFirstName')}
          error={errors.legalFirstName?.message}
          required
        />
        
        <Input
          label="Middle Initial"
          registration={register('middleInitial')}
          error={errors.middleInitial?.message}
          maxLength={1}
          className="text-center"
        />
        
        <Input
          label="Legal Last Name"
          registration={register('legalLastName')}
          error={errors.legalLastName?.message}
          required
        />
      </div>

      <Input
        label="Other Last Names Used"
        registration={register('otherLastNames')}
        error={errors.otherLastNames?.message}
        placeholder="Any previous or maiden names"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          registration={register('dateOfBirth')}
          error={errors.dateOfBirth?.message}
        />
        
        <div className="space-y-2">
          <label className="form-label">
            Social Security Number
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            className={`form-input ${errors.socialSecurityNumber ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('socialSecurityNumber')}
            onChange={(e) => {
              const formatted = formatSSN(e.target.value)
              setValue('socialSecurityNumber', formatted)
            }}
            placeholder="XXX-XX-XXXX"
            maxLength={11}
          />
          {errors.socialSecurityNumber && (
            <p className="form-error">{errors.socialSecurityNumber.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}