import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '@/shared/validation/schemas'
import { Input } from '../ui/Input'
import { EquipmentExperience } from '../ui/EquipmentExperience'
import { SkillsQualifications } from '../ui/SkillsQualifications'
import { useLanguage } from '../../contexts/LanguageContext'

interface PositionStepProps {
  form: UseFormReturn<ValidatedApplicationData>
}


export function PositionStep({ form }: PositionStepProps) {
  const { register, formState: { errors } } = form
  const { t } = useLanguage()

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('position.position_applied_for')}
          registration={register('positionApplied')}
          error={errors.positionApplied?.message}
          placeholder={t('position.position_placeholder')}
        />
        
        <Input
          label={t('position.expected_salary')}
          registration={register('expectedSalary')}
          error={errors.expectedSalary?.message}
          placeholder={t('position.salary_placeholder')}
        />
      </div>

      <Input
        label={t('position.job_discovery')}
        registration={register('jobDiscovery')}
        error={errors.jobDiscovery?.message}
        placeholder={t('position.discovery_placeholder')}
      />

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">{t('position.equipment_experience_title')}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('position.equipment_experience_description')}
        </p>
        
        <EquipmentExperience form={form} />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">{t('position.skills_qualifications_title')}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('position.skills_qualifications_description')}
        </p>
        
        <SkillsQualifications form={form} />
      </div>
    </div>
  )
}