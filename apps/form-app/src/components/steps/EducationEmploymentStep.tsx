import { useEffect } from 'react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { ValidatedApplicationData } from '../../../../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface EducationEmploymentStepProps {
  form: UseFormReturn<ValidatedApplicationData>
}

export function EducationEmploymentStep({ form }: EducationEmploymentStepProps) {
  const { register, control, formState: { errors } } = form
  const { t } = useLanguage()

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

  // Initialize with 1 education and 1 employment entry if empty
  useEffect(() => {
    if (educationFields.length === 0) {
      appendEducation({
        schoolName: '',
        graduationYear: '',
        fieldOfStudy: '',
        degreeReceived: ''
      })
    }
    if (employmentFields.length === 0) {
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
  }, [educationFields.length, employmentFields.length, appendEducation, appendEmployment])

  const addEducation = () => {
    if (educationFields.length < 3) {
      appendEducation({
        schoolName: '',
        graduationYear: '',
        fieldOfStudy: '',
        degreeReceived: ''
      })
    }
  }

  const addEmployment = () => {
    if (employmentFields.length < 3) {
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-primary">{t('education.title')}</h3>
          <button
            type="button"
            onClick={addEducation}
            disabled={educationFields.length >= 3}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            {t('education.add_button')}
          </button>
        </div>


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
                registration={register(`education.${index}.graduationYear`)}
                error={errors.education?.[index]?.graduationYear?.message}
                placeholder={t('education.graduation_placeholder')}
              />
              
              <Input
                label={t('education.field_of_study')}
                registration={register(`education.${index}.fieldOfStudy`)}
                error={errors.education?.[index]?.fieldOfStudy?.message}
                placeholder={t('education.field_placeholder')}
              />
              
              <div>
                <label className="form-label">{t('education.degree_received')}</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="yes"
                      {...register(`education.${index}.degreeReceived`)}
                      className="mr-2"
                    />
                    {t('common.yes')}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="no"
                      {...register(`education.${index}.degreeReceived`)}
                      className="mr-2"
                    />
                    {t('common.no')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employment Section */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-primary">{t('employment.title')}</h3>
          <button
            type="button"
            onClick={addEmployment}
            disabled={employmentFields.length >= 3}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            {t('employment.add_button')}
          </button>
        </div>


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
                
                <Input
                  label={t('employment.supervisor_phone')}
                  type="tel"
                  registration={register(`employment.${index}.supervisorPhone`)}
                  error={errors.employment?.[index]?.supervisorPhone?.message}
                  placeholder={t('employment.phone_placeholder')}
                />
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

              <div>
                <label className="form-label">{t('employment.may_contact')}</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="yes"
                      {...register(`employment.${index}.mayContact`)}
                      className="mr-2"
                    />
                    {t('common.yes')}
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="no"
                      {...register(`employment.${index}.mayContact`)}
                      className="mr-2"
                    />
                    {t('common.no')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}