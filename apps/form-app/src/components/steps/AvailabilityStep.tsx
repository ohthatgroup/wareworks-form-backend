import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { RadioGroup } from '../ui/RadioGroup'
import { useLanguage } from '../../contexts/LanguageContext'
import { translateKey } from '../../types/translations'

interface AvailabilityStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function AvailabilityStep({ form }: AvailabilityStepProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const { t } = useLanguage()
  const previouslyApplied = watch('previouslyApplied')
  
  // Check if weekly availability should be shown
  const fullTimeEmployment = watch('fullTimeEmployment')
  const swingShifts = watch('swingShifts')
  const graveyardShifts = watch('graveyardShifts')
  
  const showWeeklyAvailability = fullTimeEmployment === 'no' || 
                                swingShifts === 'no' || 
                                graveyardShifts === 'no'

  const yesNoOptions = [
    { value: 'yes', label: t('common.yes') },
    { value: 'no', label: t('common.no') }
  ]

  return (
    <div className="space-y-6">

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">{t('availability.work_preferences_title')}</h3>
        
        <div className="space-y-6">
          <RadioGroup
            label={t('availability.full_time_question')}
            name="fullTimeEmployment"
            options={yesNoOptions}
            registration={register('fullTimeEmployment')}
            error={errors.fullTimeEmployment?.message}
            required
          />

          <RadioGroup
            label={t('availability.swing_shifts_question')}
            name="swingShifts"
            options={yesNoOptions}
            registration={register('swingShifts')}
            error={errors.swingShifts?.message}
            required
          />

          <RadioGroup
            label={t('availability.graveyard_shifts_question')}
            name="graveyardShifts"
            options={yesNoOptions}
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
              { key: 'availabilitySunday', labelKey: 'availability.sunday', descriptionKey: 'availability.sunday_description' },
              { key: 'availabilityMonday', labelKey: 'availability.monday', descriptionKey: 'availability.monday_description' },
              { key: 'availabilityTuesday', labelKey: 'availability.tuesday', descriptionKey: 'availability.tuesday_description' },
              { key: 'availabilityWednesday', labelKey: 'availability.wednesday', descriptionKey: 'availability.wednesday_description' },
              { key: 'availabilityThursday', labelKey: 'availability.thursday', descriptionKey: 'availability.thursday_description' },
              { key: 'availabilityFriday', labelKey: 'availability.friday', descriptionKey: 'availability.friday_description' },
              { key: 'availabilitySaturday', labelKey: 'availability.saturday', descriptionKey: 'availability.saturday_description' }
            ].map((day) => {
              const currentValue = watch(day.key as keyof ValidatedApplicationData) as string
              // Consider the day selected if it has any value (excluding the placeholder)
              const isSelected = Boolean(currentValue !== undefined && currentValue !== null && currentValue !== '' && currentValue !== 'SELECTED')
              
              return (
                <div 
                  key={day.key}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`${day.key}_checkbox`}
                        checked={isSelected || currentValue === 'SELECTED'}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setValue(day.key as keyof ValidatedApplicationData, '')
                          } else {
                            // Set empty string to show the time input field
                            setValue(day.key as keyof ValidatedApplicationData, '')
                          }
                        }}
                        className="w-5 h-5 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`${day.key}_checkbox`}
                          className="text-sm font-medium text-gray-900 cursor-pointer block"
                        >
                          {translateKey(t, day.labelKey)}
                        </label>
                      </div>
                    </div>
                    
                    {/* Availability Time Input - full width below label */}
                    {(isSelected || currentValue === 'SELECTED') && (
                      <div className="ml-8">
                        <input
                          {...register(day.key as keyof ValidatedApplicationData)}
                          type="text"
                          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                          placeholder={t('availability.time_placeholder')}
                        />
                      </div>
                    )}
                    <div className="ml-8">                    
                      <p className="text-xs text-gray-600">
                        {t(day.descriptionKey)}
                      </p>
                      
                      {/* Error display */}
                      {(isSelected || currentValue === 'SELECTED') && errors[day.key as keyof ValidatedApplicationData] && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors[day.key as keyof ValidatedApplicationData]?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t('availability.note_title')}</strong> {t('availability.note_message')}
            </p>
          </div>
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">{t('availability.previous_application_title')}</h3>
        
        <div className="space-y-4">
          <RadioGroup
            label={t('availability.previously_applied_question')}
            name="previouslyApplied"
            options={yesNoOptions}
            registration={register('previouslyApplied')}
            error={errors.previouslyApplied?.message}
            required
          />

          {previouslyApplied === 'yes' && (
            <Input
              label={t('availability.when_where_label')}
              registration={register('previousApplicationWhen')}
              error={errors.previousApplicationWhen?.message}
              placeholder={t('availability.when_where_placeholder')}
              required
            />
          )}
        </div>
      </div>
    </div>
  )
}