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

const ALIEN_WORK_AUTH_OPTIONS = [
  { value: 'uscis_a_number', label: 'USCIS A-Number' },
  { value: 'form_i94', label: 'Form I-94 Admission Number' },
  { value: 'foreign_passport', label: 'Foreign Passport Number and Country of Issuance' }
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
      />

      {/* Conditional fields based on citizenship status */}
      {citizenshipStatus === 'lawful_permanent' && (
        <Input
          label="USCIS A-Number"
          registration={register('uscisANumber')}
          error={errors.uscisANumber?.message}
          placeholder="A12345678"
        />
      )}

      {citizenshipStatus === 'alien_authorized' && (
        <div className="space-y-4">
          <Input
            label="Work Authorization Expiration Date"
            type="date"
            registration={register('workAuthExpiration')}
            error={errors.workAuthExpiration?.message}
          />
          
          <Select
            label="Enter one of the following"
            registration={register('alienDocumentType')}
            error={errors.alienDocumentType?.message}
            options={ALIEN_WORK_AUTH_OPTIONS}
            placeholder="Select which information you will provide"
          />
          
          {watch('alienDocumentType') === 'uscis_a_number' && (
            <Input
              label="USCIS A-Number"
              registration={register('alienDocumentNumber')}
              error={errors.alienDocumentNumber?.message}
              placeholder="A12345678"
            />
          )}
          
          {watch('alienDocumentType') === 'form_i94' && (
            <Input
              label="Form I-94 Admission Number"
              registration={register('alienDocumentNumber')}
              error={errors.alienDocumentNumber?.message}
              placeholder="I-94 admission number"
            />
          )}
          
          {watch('alienDocumentType') === 'foreign_passport' && (
            <div className="space-y-4">
              <Input
                label="Foreign Passport Number"
                registration={register('alienDocumentNumber')}
                error={errors.alienDocumentNumber?.message}
                placeholder="Passport number"
              />
              <Input
                label="Country of Issuance"
                registration={register('documentCountry')}
                error={errors.documentCountry?.message}
                placeholder="Country that issued the passport"
              />
            </div>
          )}
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