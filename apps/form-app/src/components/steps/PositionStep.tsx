import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface PositionStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

const EXPERIENCE_LEVELS = [
  { value: 'none', label: 'None' },
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
]

export function PositionStep({ form }: PositionStepProps) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Position Information</h3>
        <p className="text-sm text-green-800">
          Tell us about the position you're interested in and your relevant experience with warehouse equipment.
        </p>
      </div>

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
          Please rate your experience level with the following warehouse equipment:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="SD (Sit Down Forklift)"
            registration={register('equipmentSD')}
            error={errors.equipmentSD?.message}
            options={EXPERIENCE_LEVELS}
            placeholder="Select experience level"
          />
          
          <Select
            label="SU (Stand Up Forklift)"
            registration={register('equipmentSU')}
            error={errors.equipmentSU?.message}
            options={EXPERIENCE_LEVELS}
            placeholder="Select experience level"
          />
          
          <Select
            label="SUR (Stand Up Reach)"
            registration={register('equipmentSUR')}
            error={errors.equipmentSUR?.message}
            options={EXPERIENCE_LEVELS}
            placeholder="Select experience level"
          />
          
          <Select
            label="CP (Cherry Picker)"
            registration={register('equipmentCP')}
            error={errors.equipmentCP?.message}
            options={EXPERIENCE_LEVELS}
            placeholder="Select experience level"
          />
          
          <Select
            label="CL (Clamps)"
            registration={register('equipmentCL')}
            error={errors.equipmentCL?.message}
            options={EXPERIENCE_LEVELS}
            placeholder="Select experience level"
          />
          
          <Select
            label="Riding Jack"
            registration={register('equipmentRidingJack')}
            error={errors.equipmentRidingJack?.message}
            options={EXPERIENCE_LEVELS}
            placeholder="Select experience level"
          />
        </div>
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