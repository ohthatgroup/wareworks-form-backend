import { useEffect } from 'react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { ValidatedApplicationData } from '@/shared/validation/schemas'
import { Input } from '../ui/Input'
import { RadioGroup } from '../ui/RadioGroup'
import { Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface EducationEmploymentStepProps {
  form: UseFormReturn<ValidatedApplicationData>
}

export function EducationEmploymentStep({ form }: EducationEmploymentStepProps) {
  const { register, control, setValue, formState: { errors } } = form
  const { t } = useLanguage()

  // Phone number formatting function (same as ContactInfoStep)
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control,
    name: 'education',
  })

  const {
    fields: employmentFields,
    append: appendEmployment,
    remove: removeEmployment,
  } = useFieldArray({
    control,
    name: 'employment',
  })

  // Don't auto-initialize entries - let users add them when needed

  const addEducation = () => {
    if (educationFields.length < 2) {
      appendEducation({
        schoolName: '',
        graduationYear: '',
        fieldOfStudy: '',
        degreeReceived: ''
      })
    }
  }

  const addEmployment = () => {
    if (employmentFields.length < 2) {
      appendEmployment({
        companyName: '',
        startDate: '',
        endDate: '',
        startingPosition: '',
        endingPosition: '',
        supervisorName: '',
        supervisorPhone: '',
        responsibilities: '',
        reasonForLeaving: '',
        mayContact: ''
      })
    }
  }

  return (
    <div className="space-y-8">

      {/* Education Section */}
      <div className="border-t pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-primary">{t('education.title')}</h3>
        </div>


        {educationFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{t('education.no_entries_message') || 'Click "Add Education" to add your educational background.'}</p>
          </div>
        ) : null}

        {educationFields.map((field, index) => (
          <div key={field.id} className="bg-gray-50 rounded-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">{t('education.entry_title')} {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('education.school_name')}
                registration={register(`education.${index}.schoolName`)}
                error={errors.education?.[index]?.schoolName?.message}
                placeholder={t('education.school_placeholder')}
              />
              
              <Input
                label={t('education.graduation_year')}
                type="number"
                registration={register(`education.${index}.graduationYear`)}
                error={errors.education?.[index]?.graduationYear?.message}
                placeholder={t('education.graduation_placeholder')}
                min="1950"
                max="2030"
              />
              
              <Input
                label={t('education.field_of_study')}
                registration={register(`education.${index}.fieldOfStudy`)}
                error={errors.education?.[index]?.fieldOfStudy?.message}
                placeholder={t('education.field_placeholder')}
              />
              
              <RadioGroup
                label={t('education.degree_received')}
                name={`education.${index}.degreeReceived`}
                options={[
                  { value: 'yes', label: t('common.yes') },
                  { value: 'no', label: t('common.no') }
                ]}
                registration={register(`education.${index}.degreeReceived`)}
                error={errors.education?.[index]?.degreeReceived?.message}
              />
            </div>
            
            {/* Add Education button - shown under first entry, hidden when 2 entries exist */}
            {index === 0 && educationFields.length < 2 && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={addEducation}
                  className="btn-secondary text-sm flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  {t('education.add_button')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Employment Section */}
      <div className="border-t pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-primary">{t('employment.title')}</h3>
        </div>


        {employmentFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{t('employment.no_entries_message')}</p>
          </div>
        ) : null}

        {employmentFields.map((field, index) => (
          <div key={field.id} className="bg-gray-50 rounded-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">{t('employment.entry_title')} {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeEmployment(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label={t('employment.company_name')}
                registration={register(`employment.${index}.companyName`)}
                error={errors.employment?.[index]?.companyName?.message}
                placeholder={t('employment.company_placeholder')}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('employment.start_date')}
                  type="date"
                  registration={register(`employment.${index}.startDate`)}
                  error={errors.employment?.[index]?.startDate?.message}
                />
                
                <Input
                  label={t('employment.end_date')}
                  type="date"
                  registration={register(`employment.${index}.endDate`)}
                  error={errors.employment?.[index]?.endDate?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('employment.starting_position')}
                  registration={register(`employment.${index}.startingPosition`)}
                  error={errors.employment?.[index]?.startingPosition?.message}
                  placeholder={t('employment.starting_placeholder')}
                />
                
                <Input
                  label={t('employment.ending_position')}
                  registration={register(`employment.${index}.endingPosition`)}
                  error={errors.employment?.[index]?.endingPosition?.message}
                  placeholder={t('employment.ending_placeholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('employment.supervisor_name')}
                  registration={register(`employment.${index}.supervisorName`)}
                  error={errors.employment?.[index]?.supervisorName?.message}
                  placeholder={t('employment.supervisor_placeholder')}
                />
                
                <div className="space-y-2">
                  <label className="form-label">
                    {t('employment.supervisor_phone')}
                  </label>
                  <input
                    type="tel"
                    className={`form-input ${errors.employment?.[index]?.supervisorPhone ? 'border-red-500 focus:border-red-500' : ''}`}
                    autoComplete="off"
                    {...register(`employment.${index}.supervisorPhone`)}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value)
                      setValue(`employment.${index}.supervisorPhone`, formatted)
                    }}
                    placeholder={t('employment.phone_placeholder')}
                    maxLength={14}
                  />
                  {errors.employment?.[index]?.supervisorPhone && (
                    <p className="form-error">{errors.employment[index]?.supervisorPhone?.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">{t('employment.responsibilities')}</label>
                <textarea
                  {...register(`employment.${index}.responsibilities`)}
                  className="form-input min-h-[100px]"
                  placeholder={t('employment.responsibilities_placeholder')}
                />
                {errors.employment?.[index]?.responsibilities && (
                  <p className="form-error">{errors.employment[index]?.responsibilities?.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">{t('employment.reason_leaving')}</label>
                <textarea
                  {...register(`employment.${index}.reasonForLeaving`)}
                  className="form-input min-h-[80px]"
                  placeholder={t('employment.reason_placeholder')}
                />
                {errors.employment?.[index]?.reasonForLeaving && (
                  <p className="form-error">{errors.employment[index]?.reasonForLeaving?.message}</p>
                )}
              </div>

              <RadioGroup
                label={t('employment.may_contact')}
                name={`employment.${index}.mayContact`}
                options={[
                  { value: 'yes', label: t('common.yes') },
                  { value: 'no', label: t('common.no') }
                ]}
                registration={register(`employment.${index}.mayContact`)}
                error={errors.employment?.[index]?.mayContact?.message}
              />
            </div>
            
            {/* Add Employment button - shown under first entry, hidden when 2 entries exist */}
            {index === 0 && employmentFields.length < 2 && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={addEmployment}
                  className="btn-secondary text-sm flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  {t('employment.add_button')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}