import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../../../../shared/validation/schemas'
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
  const { register, formState: { errors } } = form

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
            State <span className="text-red-500">*</span>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Primary Phone Number"
          type="tel"
          registration={register('phoneNumber')}
          error={errors.phoneNumber?.message}
          placeholder="(555) 123-4567"
          required
        />
        
        <Input
          label="Home Phone"
          type="tel"
          registration={register('homePhone')}
          error={errors.homePhone?.message}
          placeholder="(555) 123-4567"
        />
        
        <Input
          label="Cell Phone"
          type="tel"
          registration={register('cellPhone')}
          error={errors.cellPhone?.message}
          placeholder="(555) 123-4567"
        />
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
            required
          />
          
          <Input
            label="Emergency Contact Phone"
            type="tel"
            registration={register('emergencyPhone')}
            error={errors.emergencyPhone?.message}
            placeholder="(555) 123-4567"
            required
          />
          
          <Input
            label="Relationship"
            registration={register('emergencyRelationship')}
            error={errors.emergencyRelationship?.message}
            placeholder="e.g., Spouse, Parent, Sibling"
            required
          />
        </div>
      </div>
    </div>
  )
}