import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'

interface EquipmentItem {
  key: keyof ValidatedApplicationData
  label: string
  description: string
}

interface EquipmentExperienceProps {
  form: UseFormReturn<ValidatedApplicationData>
}

const EQUIPMENT_LIST: EquipmentItem[] = [
  { key: 'equipmentSD', label: 'SD - Sit Down Forklift', description: 'Standard sit-down counterbalance forklift' },
  { key: 'equipmentSU', label: 'SU - Stand Up Forklift', description: 'Stand-up counterbalance forklift' },
  { key: 'equipmentSUR', label: 'SUR - Stand Up Reach', description: 'Stand-up reach truck for narrow aisles' },
  { key: 'equipmentCP', label: 'CP - Cherry Picker', description: 'Order picker/cherry picker lift' },
  { key: 'equipmentCL', label: 'CL - Clamps', description: 'Forklift with clamp attachment' },
  { key: 'equipmentRidingJack', label: 'Riding Jack', description: 'Electric pallet jack/riding jack' }
]

const EXPERIENCE_LEVELS = [
  { value: 'none', label: 'No Experience' },
  { value: 'basic', label: 'Basic (< 1 year)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'advanced', label: 'Advanced (3+ years)' },
  { value: 'expert', label: 'Expert (5+ years)' },
  { value: 'certified', label: 'Certified' }
]

export function EquipmentExperience({ form }: EquipmentExperienceProps) {
  const { register, watch, setValue, formState: { errors } } = form

  const isEquipmentSelected = (equipmentKey: string): boolean => {
    const value = watch(equipmentKey as keyof ValidatedApplicationData)
    return Boolean(value && value !== '')
  }

  const toggleEquipment = (equipmentKey: string, checked: boolean) => {
    if (!checked) {
      // Clear the experience level when unchecking
      setValue(equipmentKey as keyof ValidatedApplicationData, '')
    } else {
      // Set a placeholder value when checking to show dropdown
      setValue(equipmentKey as keyof ValidatedApplicationData, 'none')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
        {EQUIPMENT_LIST.map((equipment) => {
          const isSelected = isEquipmentSelected(equipment.key)
          const currentValue = watch(equipment.key) as string
          
          return (
            <div 
              key={equipment.key}
              className={`border rounded-lg p-4 transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={equipment.key}
                  checked={isSelected}
                  onChange={(e) => {
                    toggleEquipment(equipment.key, e.target.checked)
                  }}
                  className="w-5 h-5 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor={equipment.key}
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {equipment.label}
                    </label>
                    
                    {/* Experience Level Dropdown - to the right of label */}
                    {isSelected && (
                      <select
                        {...register(equipment.key)}
                        className="ml-3 flex-1 min-w-0 text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-primary focus:border-primary"
                        defaultValue={currentValue || ''}
                      >
                        <option value="">Select level...</option>
                        {EXPERIENCE_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-1">
                    {equipment.description}
                  </p>
                  
                  {/* Error display */}
                  {isSelected && errors[equipment.key] && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[equipment.key]?.message}
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
          <strong>Note:</strong> Select "Certified" if you have official certification for any equipment. 
          You'll be able to upload certification documents in the Documents section.
        </p>
      </div>
    </div>
  )
}