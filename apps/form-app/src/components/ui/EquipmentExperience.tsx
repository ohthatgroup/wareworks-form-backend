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

// This will be dynamically generated using translation keys

export function EquipmentExperience({ form }: EquipmentExperienceProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const { t } = useLanguage()
  
  const forkliftCertification = watch('forkliftCertification')
  
  const yesNoOptions = [
    { value: 'yes', label: t('common.yes') },
    { value: 'no', label: t('common.no') }
  ]
  
  const forkliftTypes: ForkliftType[] = [
    { key: 'forkliftSD', label: t('equipment.sd_label'), description: t('equipment.sd_description') },
    { key: 'forkliftSU', label: t('equipment.su_label'), description: t('equipment.su_description') },
    { key: 'forkliftSUR', label: t('equipment.sur_label'), description: t('equipment.sur_description') },
    { key: 'forkliftCP', label: t('equipment.cp_label'), description: t('equipment.cp_description') },
    { key: 'forkliftCL', label: t('equipment.cl_label'), description: t('equipment.cl_description') },
    { key: 'forkliftRidingJack', label: t('equipment.riding_jack_label'), description: t('equipment.riding_jack_description') }
  ]

  return (
    <div className="space-y-6">
      {/* Main forklift certification question */}
      <RadioGroup
        label={t('forklift.certification_question')}
        name="forkliftCertification"
        options={yesNoOptions}
        registration={register('forkliftCertification')}
        error={errors.forkliftCertification?.message}
      />

      {/* Conditional forklift types section */}
      {forkliftCertification === 'yes' && (
        <div className="border-t pt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {t('forklift.which_types_question')}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {forkliftTypes.map((forklift) => {
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