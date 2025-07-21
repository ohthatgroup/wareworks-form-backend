import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { RadioGroup } from '../ui/RadioGroup'

interface AvailabilityStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function AvailabilityStep({ form }: AvailabilityStepProps) {
  const { register, watch, setValue, formState: { errors } } = form
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
        
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {[
              { key: 'availabilitySunday', label: 'Sunday', description: 'Available on Sunday' },
              { key: 'availabilityMonday', label: 'Monday', description: 'Available on Monday' },
              { key: 'availabilityTuesday', label: 'Tuesday', description: 'Available on Tuesday' },
              { key: 'availabilityWednesday', label: 'Wednesday', description: 'Available on Wednesday' },
              { key: 'availabilityThursday', label: 'Thursday', description: 'Available on Thursday' },
              { key: 'availabilityFriday', label: 'Friday', description: 'Available on Friday' },
              { key: 'availabilitySaturday', label: 'Saturday', description: 'Available on Saturday' }
            ].map((day) => {
              const currentValue = watch(day.key as keyof ValidatedApplicationData) as string
              const isSelected = Boolean(currentValue && currentValue.trim() !== '')
              
              return (
                <div 
                  key={day.key}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={`${day.key}_checkbox`}
                      checked={isSelected}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          setValue(day.key as keyof ValidatedApplicationData, '')
                        } else {
                          // Set a placeholder value to show the time input field
                          setValue(day.key as keyof ValidatedApplicationData, 'available')
                        }
                      }}
                      className="w-5 h-5 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-0"
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={`${day.key}_checkbox`}
                        className="block text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {day.label}
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        {day.description}
                      </p>
                      
                      {/* Availability Time Input */}
                      {isSelected && (
                        <div className="mt-3 space-y-1">
                          <label className="block text-xs font-medium text-gray-700">
                            Available Hours
                          </label>
                          <input
                            {...register(day.key as keyof ValidatedApplicationData)}
                            type="text"
                            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:ring-primary focus:border-primary"
                            placeholder="e.g., 8AM-5PM or Flexible"
                          />
                          {errors[day.key as keyof ValidatedApplicationData] && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors[day.key as keyof ValidatedApplicationData]?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Enter your available hours for each day (e.g., "8AM-5PM", "6PM-11PM") or write "Not Available" if you cannot work that day.
            </p>
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