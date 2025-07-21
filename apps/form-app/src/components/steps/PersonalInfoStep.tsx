import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../../../../shared/validation/schemas'
import { Input } from '../ui/Input'

interface PersonalInfoStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function PersonalInfoStep({ form }: PersonalInfoStepProps) {
  const { register, formState: { errors } } = form

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
          required
        />
        
        <Input
          label="Social Security Number"
          registration={register('socialSecurityNumber')}
          error={errors.socialSecurityNumber?.message}
          placeholder="XXX-XX-XXXX"
          required
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Privacy Notice</h3>
        <p className="text-sm text-blue-800">
          Your personal information is collected for employment verification purposes only and will be handled in accordance with our privacy policy and applicable laws.
        </p>
      </div>
    </div>
  )
}