import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../../../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { useLanguage } from '../../contexts/LanguageContext'

interface PersonalInfoStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function PersonalInfoStep({ form }: PersonalInfoStepProps) {
  const { register, formState: { errors }, setValue, watch } = form
  const { t } = useLanguage()
  
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
          label={t('personal_info.legal_first_name')}
          registration={register('legalFirstName')}
          error={errors.legalFirstName?.message}
          required
        />
        
        <Input
          label={t('personal_info.middle_initial')}
          registration={register('middleInitial')}
          error={errors.middleInitial?.message}
          maxLength={1}
          className="text-center"
        />
        
        <Input
          label={t('personal_info.legal_last_name')}
          registration={register('legalLastName')}
          error={errors.legalLastName?.message}
          required
        />
      </div>

      <Input
        label={t('personal_info.other_last_names')}
        registration={register('otherLastNames')}
        error={errors.otherLastNames?.message}
        placeholder={t('personal_info.other_names_placeholder')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('personal_info.date_of_birth')}
          type="date"
          registration={register('dateOfBirth')}
          error={errors.dateOfBirth?.message}
        />
        
        <div className="space-y-2">
          <label className="form-label">
            {t('personal_info.social_security_number')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            className={`form-input ${errors.socialSecurityNumber ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('socialSecurityNumber')}
            onChange={(e) => {
              const formatted = formatSSN(e.target.value)
              setValue('socialSecurityNumber', formatted)
            }}
            placeholder={t('personal_info.ssn_placeholder')}
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