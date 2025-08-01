import { UseFormReturn } from 'react-hook-form'
import { useEffect } from 'react'
import { ValidatedApplicationData } from '@/shared/validation/schemas'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { RadioGroup } from '../ui/RadioGroup'
import { useLanguage } from '../../contexts/LanguageContext'

interface CitizenshipStepProps {
  form: UseFormReturn<ValidatedApplicationData>
}

// Options will be generated inside the component to use translations

export function CitizenshipStep({ form }: CitizenshipStepProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const { t } = useLanguage()
  const citizenshipStatus = watch('citizenshipStatus')
  
  // We don't need aggressive field clearing - let users navigate freely
  
  const citizenshipOptions = [
    { value: 'us_citizen', label: t('citizenship.us_citizen') },
    { value: 'noncitizen_national', label: t('citizenship.noncitizen_national') },
    { value: 'lawful_permanent', label: t('citizenship.lawful_permanent') },
    { value: 'alien_authorized', label: t('citizenship.alien_authorized') }
  ]

  const alienWorkAuthOptions = [
    { value: 'uscis_a_number', label: t('citizenship.uscis_option') },
    { value: 'form_i94', label: t('citizenship.form_i94_option') },
    { value: 'foreign_passport', label: t('citizenship.foreign_passport_option') }
  ]

  const yesNoOptions = [
    { value: 'yes', label: t('common.yes') },
    { value: 'no', label: t('common.no') }
  ]

  return (
    <div className="space-y-6">

      <Select
        label={t('citizenship.status_label')}
        registration={register('citizenshipStatus')}
        error={errors.citizenshipStatus?.message}
        options={citizenshipOptions}
        placeholder={t('citizenship.status_placeholder')}
      />

      {/* Conditional fields based on citizenship status */}
      {citizenshipStatus === 'lawful_permanent' && (
        <Input
          label={t('citizenship.uscis_a_number')}
          registration={register('uscisANumber')}
          error={errors.uscisANumber?.message}
          placeholder={t('citizenship.a_number_placeholder')}
        />
      )}

      {citizenshipStatus === 'alien_authorized' && (
        <div className="space-y-4">
          <Input
            label={t('citizenship.work_auth_expiration')}
            type="date"
            registration={register('workAuthExpiration')}
            error={errors.workAuthExpiration?.message}
          />
          
          <Select
            label={t('citizenship.select_document_type')}
            registration={register('alienDocumentType')}
            error={errors.alienDocumentType?.message}
            options={alienWorkAuthOptions}
            placeholder={t('citizenship.document_type_placeholder')}
          />
          
          {watch('alienDocumentType') === 'uscis_a_number' && (
            <Input
              label={t('citizenship.uscis_a_number')}
              registration={register('alienDocumentNumber')}
              error={errors.alienDocumentNumber?.message}
              placeholder={t('citizenship.a_number_placeholder')}
              required
            />
          )}
          
          {watch('alienDocumentType') === 'form_i94' && (
            <Input
              label={t('citizenship.form_i94_admission')}
              registration={register('i94AdmissionNumber')}
              error={errors.i94AdmissionNumber?.message}
              placeholder={t('citizenship.i94_placeholder')}
              required
            />
          )}
          
          {watch('alienDocumentType') === 'foreign_passport' && (
            <div className="space-y-4">
              <Input
                label={t('citizenship.foreign_passport_number')}
                registration={register('foreignPassportNumber')}
                error={errors.foreignPassportNumber?.message}
                placeholder={t('citizenship.passport_placeholder')}
                required
              />
              <Input
                label={t('citizenship.country_of_issuance')}
                registration={register('foreignPassportCountry')}
                error={errors.foreignPassportCountry?.message}
                placeholder={t('citizenship.country_placeholder')}
                required
              />
            </div>
          )}
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-primary mb-4">{t('citizenship.basic_eligibility_title')}</h3>
        
        <div className="space-y-6">
          <RadioGroup
            label={t('citizenship.age_18_question')}
            name="age18"
            options={yesNoOptions}
            registration={register('age18')}
            error={errors.age18?.message}
          />

          <RadioGroup
            label={t('citizenship.transportation_question')}
            name="transportation"
            options={yesNoOptions}
            registration={register('transportation')}
            error={errors.transportation?.message}
          />

          <RadioGroup
            label={t('citizenship.work_auth_question')}
            name="workAuthorizationConfirm"
            options={yesNoOptions}
            registration={register('workAuthorizationConfirm')}
            error={errors.workAuthorizationConfirm?.message}
          />
        </div>
      </div>
    </div>
  )
}