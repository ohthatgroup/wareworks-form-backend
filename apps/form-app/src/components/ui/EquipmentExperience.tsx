import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '@/shared/validation/schemas'
import { useLanguage } from '../../contexts/LanguageContext'
import { RadioGroup } from './RadioGroup'

interface ForkliftType {
  key: keyof ValidatedApplicationData
  label: string
  description: string
}

interface EquipmentExperienceProps {
  form: UseFormReturn<ValidatedApplicationData>
}

const FORKLIFT_TYPES: ForkliftType[] = [
  { key: 'forkliftSD', label: 'SD - Sit Down Forklift', description: 'Standard sit-down counterbalance forklift' },
  { key: 'forkliftSU', label: 'SU - Stand Up Forklift', description: 'Stand-up counterbalance forklift' },
  { key: 'forkliftSUR', label: 'SUR - Stand Up Reach', description: 'Stand-up reach truck for narrow aisles' },
  { key: 'forkliftCP', label: 'CP - Cherry Picker', description: 'Order picker/cherry picker lift' },
  { key: 'forkliftCL', label: 'CL - Clamps', description: 'Forklift with clamp attachment' },
  { key: 'forkliftRidingJack', label: 'Riding Jack', description: 'Electric pallet jack/riding jack' }
]

export function EquipmentExperience({ form }: EquipmentExperienceProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const { t } = useLanguage()
  
  const forkliftCertification = watch('forkliftCertification')
  
  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ]

  return (
    <div className="space-y-6">
      {/* Main forklift certification question */}
      <RadioGroup
        label="Do you have forklift certification?"
        name="forkliftCertification"
        options={yesNoOptions}
        registration={register('forkliftCertification')}
        error={errors.forkliftCertification?.message}
      />

      {/* Conditional forklift types section */}
      {forkliftCertification === 'yes' && (
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Which forklift types are you certified for?
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FORKLIFT_TYPES.map((forklift) => {
              const isChecked = watch(forklift.key) as boolean
              
              return (
                <div key={forklift.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={forklift.key}
                    {...register(forklift.key)}
                    className="w-5 h-5 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={forklift.key}
                      className="text-sm font-medium text-gray-900 cursor-pointer block"
                    >
                      {forklift.label}
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      {forklift.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          
        </div>
      )}
    </div>
  )
}