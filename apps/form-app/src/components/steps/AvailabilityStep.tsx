import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'

interface AvailabilityStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function AvailabilityStep({ form }: AvailabilityStepProps) {
  const { register, watch, formState: { errors } } = form
  const previouslyApplied = watch('previouslyApplied')

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Work Preferences & Availability</h3>
        <p className="text-sm text-blue-800">
          Help us understand your availability and work preferences to find the best fit.
        </p>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Work Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label className="form-label">
              Are you interested in full-time employment? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="yes"
                  {...register('fullTimeEmployment')}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="no"
                  {...register('fullTimeEmployment')}
                  className="mr-2"
                />
                No
              </label>
            </div>
            {errors.fullTimeEmployment && (
              <p className="form-error">{errors.fullTimeEmployment.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">
              Are you available for swing shifts (3PM-11PM)? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="yes"
                  {...register('swingShifts')}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="no"
                  {...register('swingShifts')}
                  className="mr-2"
                />
                No
              </label>
            </div>
            {errors.swingShifts && (
              <p className="form-error">{errors.swingShifts.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">
              Are you available for graveyard shifts (11PM-7AM)? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="yes"
                  {...register('graveyardShifts')}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="no"
                  {...register('graveyardShifts')}
                  className="mr-2"
                />
                No
              </label>
            </div>
            {errors.graveyardShifts && (
              <p className="form-error">{errors.graveyardShifts.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Weekly Availability</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please specify your availability for each day of the week (e.g., "8AM-5PM", "6PM-2AM", or "Not Available"):
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

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">Previous Application History</h3>
        
        <div className="space-y-4">
          <div>
            <label className="form-label">
              Have you previously applied at WareWorks? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="yes"
                  {...register('previouslyApplied')}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="no"
                  {...register('previouslyApplied')}
                  className="mr-2"
                />
                No
              </label>
            </div>
            {errors.previouslyApplied && (
              <p className="form-error">{errors.previouslyApplied.message}</p>
            )}
          </div>

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