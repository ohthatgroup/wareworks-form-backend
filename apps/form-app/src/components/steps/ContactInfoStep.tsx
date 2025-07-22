import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'

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
            label="Street Address"
            registration={register('streetAddress')}
            error={errors.streetAddress?.message}
            required
          />
        </div>
        
        <Input
          label="Apartment #"
          registration={register('aptNumber')}
          error={errors.aptNumber?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="City"
          registration={register('city')}
          error={errors.city?.message}
          required
        />
        
        <div>
          <label className="form-label">
            State
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            className={`form-input ${errors.state ? 'border-red-500 focus:border-red-500' : ''}`}
            {...register('state')}
          >
            <option value="">Select State</option>
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
          label="ZIP Code"
          registration={register('zipCode')}
          error={errors.zipCode?.message}
          placeholder="12345 or 12345-6789"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="form-label">
            Phone Number 1
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              className={`form-input ${errors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
              {...register('phoneNumber')}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setValue('phoneNumber', formatted)
              }}
              placeholder="(555) 123-4567"
              maxLength={14}
            />
            <label className="flex items-center text-sm whitespace-nowrap">
              <input
                type="checkbox"
                {...register('primaryPhoneNumber1')}
                className="mr-1"
              />
              Primary
            </label>
          </div>
          {errors.phoneNumber && (
            <p className="form-error">{errors.phoneNumber.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="form-label">Phone Number 2</label>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              className={`form-input ${errors.homePhone ? 'border-red-500 focus:border-red-500' : ''}`}
              {...register('homePhone')}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setValue('homePhone', formatted)
              }}
              placeholder="(555) 123-4567"
              maxLength={14}
            />
            <label className="flex items-center text-sm whitespace-nowrap">
              <input
                type="checkbox"
                {...register('primaryPhoneNumber2')}
                className="mr-1"
              />
              Primary
            </label>
          </div>
          {errors.homePhone && (
            <p className="form-error">{errors.homePhone.message}</p>
          )}
        </div>
      </div>

      <Input
        label="Email Address"
        type="email"
        registration={register('email')}
        error={errors.email?.message}
        placeholder="your.email@example.com"
      />

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Emergency Contact</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Emergency Contact Name"
            registration={register('emergencyName')}
            error={errors.emergencyName?.message}
          />
          
          <div className="space-y-2">
            <label className="form-label">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              className={`form-input ${errors.emergencyPhone ? 'border-red-500 focus:border-red-500' : ''}`}
              {...register('emergencyPhone')}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setValue('emergencyPhone', formatted)
              }}
              placeholder="(555) 123-4567"
              maxLength={14}
            />
            {errors.emergencyPhone && (
              <p className="form-error">{errors.emergencyPhone.message}</p>
            )}
          </div>
          
          <Input
            label="Relationship"
            registration={register('emergencyRelationship')}
            error={errors.emergencyRelationship?.message}
            placeholder="e.g., Spouse, Parent, Sibling"
          />
        </div>
      </div>
    </div>
  )
}