import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { RadioGroup } from '../ui/RadioGroup'

interface AvailabilityStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function AvailabilityStep({ form }: AvailabilityStepProps) {
  const { register, watch, formState: { errors } } = form
  const previouslyApplied = watch('previouslyApplied')
  
  // Check if weekly availability should be shown
  const fullTimeEmployment = watch('fullTimeEmployment')
  const swingShifts = watch('swingShifts')
  const graveyardShifts = watch('graveyardShifts')
  
  const showWeeklyAvailability = fullTimeEmployment === 'no' || 
                                swingShifts === 'no' || 
                                graveyardShifts === 'no'

  return (
    <div className="space-y-6">

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Work Preferences</h3>
        
        <div className="space-y-6">
          <RadioGroup
            label="Are you interested in full-time employment?"
            name="fullTimeEmployment"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            registration={register('fullTimeEmployment')}
            error={errors.fullTimeEmployment?.message}
            required
          />

          <RadioGroup
            label="Are you available for swing shifts (3PM-11PM)?"
            name="swingShifts"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            registration={register('swingShifts')}
            error={errors.swingShifts?.message}
            required
          />

          <RadioGroup
            label="Are you available for graveyard shifts (11PM-7AM)?"
            name="graveyardShifts"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            registration={register('graveyardShifts')}
            error={errors.graveyardShifts?.message}
            required
          />
        </div>
      </div>

      {showWeeklyAvailability && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-primary mb-4">Weekly Availability</h3>
          <p className="text-sm text-gray-600 mb-4">
            Since you indicated limited availability for standard shifts, please specify your availability for each day:
          </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Sunday"
            registration={register('availabilitySunday')}
            error={errors.availabilitySunday?.message}
            placeholder="e.g., 8AM-5PM or Not Available"
          />
          
          <Input
            label="Monday"
            registration={register('availabilityMonday')}
            error={errors.availabilityMonday?.message}
            placeholder="e.g., 8AM-5PM or Not Available"
          />
          
          <Input
            label="Tuesday"
            registration={register('availabilityTuesday')}
            error={errors.availabilityTuesday?.message}
            placeholder="e.g., 8AM-5PM or Not Available"
          />
          
          <Input
            label="Wednesday"
            registration={register('availabilityWednesday')}
            error={errors.availabilityWednesday?.message}
            placeholder="e.g., 8AM-5PM or Not Available"
          />
          
          <Input
            label="Thursday"
            registration={register('availabilityThursday')}
            error={errors.availabilityThursday?.message}
            placeholder="e.g., 8AM-5PM or Not Available"
          />
          
          <Input
            label="Friday"
            registration={register('availabilityFriday')}
            error={errors.availabilityFriday?.message}
            placeholder="e.g., 8AM-5PM or Not Available"
          />
          
          <Input
            label="Saturday"
            registration={register('availabilitySaturday')}
            error={errors.availabilitySaturday?.message}
            placeholder="e.g., 8AM-5PM or Not Available"
          />
        </div>
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Previous Application History</h3>
        
        <div className="space-y-4">
          <RadioGroup
            label="Have you previously applied at WareWorks?"
            name="previouslyApplied"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            registration={register('previouslyApplied')}
            error={errors.previouslyApplied?.message}
            required
          />

          {previouslyApplied === 'yes' && (
            <Input
              label="If yes, please specify when and where"
              registration={register('previousApplicationWhen')}
              error={errors.previousApplicationWhen?.message}
              placeholder="e.g., 2022, San Diego location"
              required
            />
          )}
        </div>
      </div>
    </div>
  )
}