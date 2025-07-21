import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { RadioGroup } from '../ui/RadioGroup'

interface CitizenshipStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

const CITIZENSHIP_OPTIONS = [
  { value: 'us_citizen', label: 'A citizen of the United States' },
  { value: 'noncitizen_national', label: 'A noncitizen national of the United States' },
  { value: 'lawful_permanent', label: 'A lawful permanent resident' },
  { value: 'alien_authorized', label: 'An alien authorized to work' }
]

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'i766', label: 'Employment Authorization Document (Form I-766)' },
  { value: 'foreign_passport_i94', label: 'Foreign passport with I-94 or I-94A' },
  { value: 'drivers_license_i94', label: 'Driver\'s license with I-94 or I-94A' }
]

export function CitizenshipStep({ form }: CitizenshipStepProps) {
  const { register, watch, formState: { errors } } = form
  const citizenshipStatus = watch('citizenshipStatus')

  return (
    <div className="space-y-6">

      <Select
        label="Citizenship Status"
        registration={register('citizenshipStatus')}
        error={errors.citizenshipStatus?.message}
        options={CITIZENSHIP_OPTIONS}
        placeholder="Please select your citizenship status"
        required
      />

      {/* Conditional fields based on citizenship status */}
      {citizenshipStatus === 'lawful_permanent' && (
        <Input
          label="USCIS A-Number"
          registration={register('uscisANumber')}
          error={errors.uscisANumber?.message}
          placeholder="A12345678"
          required
        />
      )}

      {citizenshipStatus === 'alien_authorized' && (
        <div className="space-y-4">
          <Input
            label="Work Authorization Expiration Date"
            type="date"
            registration={register('workAuthExpiration')}
            error={errors.workAuthExpiration?.message}
            required
          />
          
          <Select
            label="Alien Document Type"
            registration={register('alienDocumentType')}
            error={errors.alienDocumentType?.message}
            options={DOCUMENT_TYPE_OPTIONS}
            placeholder="Select document type"
            required
          />
          
          <Input
            label="Alien Document Number"
            registration={register('alienDocumentNumber')}
            error={errors.alienDocumentNumber?.message}
            placeholder="Document number"
            required
          />
          
          <Input
            label="Document Country of Issuance"
            registration={register('documentCountry')}
            error={errors.documentCountry?.message}
            placeholder="Country that issued the document"
            required
          />
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Basic Eligibility Questions</h3>
        
        <div className="space-y-6">
          <RadioGroup
            label="Are you 18 years or older?"
            name="age18"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            registration={register('age18')}
            error={errors.age18?.message}
            required
          />

          <RadioGroup
            label="Do you have reliable transportation to work?"
            name="transportation"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            registration={register('transportation')}
            error={errors.transportation?.message}
            required
          />

          <RadioGroup
            label="Are you legally authorized to work in the United States?"
            name="workAuthorizationConfirm"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            registration={register('workAuthorizationConfirm')}
            error={errors.workAuthorizationConfirm?.message}
            required
          />
        </div>
      </div>
    </div>
  )
}