import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { useLanguage } from '../../contexts/LanguageContext'

interface EquipmentItem {
  key: keyof ValidatedApplicationData
  labelKey: string
  descriptionKey: string
}

interface EquipmentExperienceProps {
  form: UseFormReturn<ValidatedApplicationData>
}

const EQUIPMENT_LIST: EquipmentItem[] = [
  { key: 'equipmentSD', labelKey: 'equipment.sd_label', descriptionKey: 'equipment.sd_description' },
  { key: 'equipmentSU', labelKey: 'equipment.su_label', descriptionKey: 'equipment.su_description' },
  { key: 'equipmentSUR', labelKey: 'equipment.sur_label', descriptionKey: 'equipment.sur_description' },
  { key: 'equipmentCP', labelKey: 'equipment.cp_label', descriptionKey: 'equipment.cp_description' },
  { key: 'equipmentCL', labelKey: 'equipment.cl_label', descriptionKey: 'equipment.cl_description' },
  { key: 'equipmentRidingJack', labelKey: 'equipment.riding_jack_label', descriptionKey: 'equipment.riding_jack_description' }
]

export function EquipmentExperience({ form }: EquipmentExperienceProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const { t } = useLanguage()

  const experienceLevels = [
    { value: 'none', label: t('equipment.no_experience') },
    { value: 'basic', label: t('equipment.basic') },
    { value: 'intermediate', label: t('equipment.intermediate') },
    { value: 'advanced', label: t('equipment.advanced') },
    { value: 'expert', label: t('equipment.expert') },
    { value: 'certified', label: t('equipment.certified') }
  ]

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
                      {t(equipment.labelKey)}
                    </label>
                    
                    {/* Experience Level Dropdown - to the right of label */}
                    {isSelected && (
                      <select
                        {...register(equipment.key)}
                        className="ml-3 flex-1 min-w-0 text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-primary focus:border-primary"
                        defaultValue={currentValue || ''}
                      >
                        <option value="">{t('equipment.select_level')}</option>
                        {experienceLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-1">
                    {t(equipment.descriptionKey)}
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
          <strong>{t('equipment.note_title')}</strong> {t('equipment.note_message')}
        </p>
      </div>
    </div>
  )
}