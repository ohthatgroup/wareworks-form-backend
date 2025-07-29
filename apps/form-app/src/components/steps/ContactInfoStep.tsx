import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../../../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { useLanguage } from '../../contexts/LanguageContext'

interface ContactInfoStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
]

export function ContactInfoStep({ form }: ContactInfoStepProps) {
  const { register, formState: { errors }, setValue } = form
  const { t } = useLanguage()
  
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <Input
            label={t('contact_info.street_address')}
            registration={register('streetAddress')}
            error={errors.streetAddress?.message}
            required
          />
        </div>
        
        <Input
          label={t('contact_info.apartment_number')}
          registration={register('aptNumber')}
          error={errors.aptNumber?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label={t('contact_info.city')}
          registration={register('city')}
          error={errors.city?.message}
          required
        />
        
        <div>
          <label className="form-label">
            {t('contact_info.state')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            className={`form-input ${errors.state ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('state')}
          >
            <option value="">{t('contact_info.select_state')}</option>
            {US_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="form-error">{errors.state.message}</p>
          )}
        </div>
        
        <Input
          label={t('contact_info.zip_code')}
          registration={register('zipCode')}
          error={errors.zipCode?.message}
          placeholder={t('contact_info.zip_placeholder')}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="form-label">
            {t('contact_info.primary_phone')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="tel"
            className={`form-input ${errors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('phoneNumber')}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value)
              setValue('phoneNumber', formatted)
            }}
            placeholder={t('contact_info.phone_placeholder')}
            maxLength={14}
          />
          {errors.phoneNumber && (
            <p className="form-error">{errors.phoneNumber.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="form-label">{t('contact_info.secondary_phone')}</label>
          <input
            type="tel"
            className={`form-input ${errors.homePhone ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('homePhone')}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value)
              setValue('homePhone', formatted)
            }}
            placeholder={t('contact_info.phone_placeholder')}
            maxLength={14}
          />
          {errors.homePhone && (
            <p className="form-error">{errors.homePhone.message}</p>
          )}
        </div>
      </div>

      <Input
        label={t('contact_info.email')}
        type="email"
        registration={register('email')}
        error={errors.email?.message}
        placeholder={t('contact_info.email_placeholder')}
        required
      />

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">{t('contact_info.emergency_contact.title')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label={t('contact_info.emergency_contact.name')}
            registration={register('emergencyName')}
            error={errors.emergencyName?.message}
          />
          
          <div className="space-y-2">
            <label className="form-label">
              {t('contact_info.emergency_contact.phone')}
            </label>
            <input
              type="tel"
              className={`form-input ${errors.emergencyPhone ? 'border-red-500 focus:border-red-500' : ''}`}
              {...register('emergencyPhone')}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setValue('emergencyPhone', formatted)
              }}
              placeholder={t('contact_info.phone_placeholder')}
              maxLength={14}
            />
            {errors.emergencyPhone && (
              <p className="form-error">{errors.emergencyPhone.message}</p>
            )}
          </div>
          
          <Input
            label={t('contact_info.emergency_contact.relationship')}
            registration={register('emergencyRelationship')}
            error={errors.emergencyRelationship?.message}
            placeholder={t('contact_info.relationship_placeholder')}
          />
        </div>
      </div>
    </div>
  )
}