import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { EquipmentExperience } from '../ui/EquipmentExperience'
import { SkillsQualifications } from '../ui/SkillsQualifications'

interface PositionStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}


export function PositionStep({ form }: PositionStepProps) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Position Applied For"
          registration={register('positionApplied')}
          error={errors.positionApplied?.message}
          placeholder="e.g., Warehouse Associate, Forklift Operator"
          required
        />
        
        <Input
          label="Expected Salary"
          registration={register('expectedSalary')}
          error={errors.expectedSalary?.message}
          placeholder="e.g., $18/hour, $40,000/year"
        />
      </div>

      <Input
        label="How did you discover this job opening?"
        registration={register('jobDiscovery')}
        error={errors.jobDiscovery?.message}
        placeholder="e.g., Indeed, Company website, Referral, etc."
        required
      />

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Equipment Experience</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the warehouse equipment you have experience with and choose your experience level:
        </p>
        
        <EquipmentExperience form={form} />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Skills & Qualifications</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add your relevant skills, certifications, or qualifications. Check the certification box if you have documentation to upload:
        </p>
        
        <SkillsQualifications form={form} />
      </div>
    </div>
  )
}