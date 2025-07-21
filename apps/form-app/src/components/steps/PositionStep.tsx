import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { EquipmentExperience } from '../ui/EquipmentExperience'

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
          List any relevant skills, certifications, or qualifications:
        </p>
        
        <div className="space-y-4">
          <Input
            label="Skill/Qualification 1"
            registration={register('skills1')}
            error={errors.skills1?.message}
            placeholder="e.g., Forklift certification, OSHA training"
          />
          
          <Input
            label="Skill/Qualification 2"
            registration={register('skills2')}
            error={errors.skills2?.message}
            placeholder="e.g., RF Scanner experience, Inventory management"
          />
          
          <Input
            label="Skill/Qualification 3"
            registration={register('skills3')}
            error={errors.skills3?.message}
            placeholder="e.g., Team leadership, Safety training"
          />
        </div>
      </div>
    </div>
  )
}