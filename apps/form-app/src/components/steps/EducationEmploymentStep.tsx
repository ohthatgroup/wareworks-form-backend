import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Input } from '../ui/Input'
import { Plus, Trash2 } from 'lucide-react'

interface EducationEmploymentStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function EducationEmploymentStep({ form }: EducationEmploymentStepProps) {
  const { register, control, formState: { errors } } = form

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
          <h3 className="text-lg font-medium text-primary">Education History</h3>
          <button
            type="button"
            onClick={addEducation}
            disabled={educationFields.length >= 3}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Add Education
          </button>
        </div>

        {educationFields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No education entries added yet.</p>
            <button
              type="button"
              onClick={addEducation}
              className="btn-primary mt-2"
            >
              Add Your First Education Entry
            </button>
          </div>
        )}

        {educationFields.map((field, index) => (
          <div key={field.id} className="bg-gray-50 rounded-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Education Entry {index + 1}</h4>
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
                label="School Name and Location"
                registration={register(`education.${index}.schoolName`)}
                error={errors.education?.[index]?.schoolName?.message}
                placeholder="e.g., San Diego State University"
              />
              
              <Input
                label="Graduation Year"
                registration={register(`education.${index}.graduationYear`)}
                error={errors.education?.[index]?.graduationYear?.message}
                placeholder="e.g., 2020"
              />
              
              <Input
                label="Field of Study/Major"
                registration={register(`education.${index}.fieldOfStudy`)}
                error={errors.education?.[index]?.fieldOfStudy?.message}
                placeholder="e.g., Business Administration"
              />
              
              <div>
                <label className="form-label">Diploma/Degree Received</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="yes"
                      {...register(`education.${index}.degreeReceived`)}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="no"
                      {...register(`education.${index}.degreeReceived`)}
                      className="mr-2"
                    />
                    No
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
          <h3 className="text-lg font-medium text-primary">Employment History</h3>
          <button
            type="button"
            onClick={addEmployment}
            disabled={employmentFields.length >= 3}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Add Employment
          </button>
        </div>

        {employmentFields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No employment entries added yet.</p>
            <button
              type="button"
              onClick={addEmployment}
              className="btn-primary mt-2"
            >
              Add Your First Employment Entry
            </button>
          </div>
        )}

        {employmentFields.map((field, index) => (
          <div key={field.id} className="bg-gray-50 rounded-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Employment Entry {index + 1}</h4>
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
                label="Company Name and Location"
                registration={register(`employment.${index}.companyName`)}
                error={errors.employment?.[index]?.companyName?.message}
                placeholder="e.g., ABC Logistics, San Diego, CA"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  registration={register(`employment.${index}.startDate`)}
                  error={errors.employment?.[index]?.startDate?.message}
                />
                
                <Input
                  label="End Date"
                  type="date"
                  registration={register(`employment.${index}.endDate`)}
                  error={errors.employment?.[index]?.endDate?.message}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Starting Position"
                  registration={register(`employment.${index}.startingPosition`)}
                  error={errors.employment?.[index]?.startingPosition?.message}
                  placeholder="e.g., Warehouse Associate"
                />
                
                <Input
                  label="Ending Position"
                  registration={register(`employment.${index}.endingPosition`)}
                  error={errors.employment?.[index]?.endingPosition?.message}
                  placeholder="e.g., Lead Warehouse Associate"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Supervisor Name"
                  registration={register(`employment.${index}.supervisorName`)}
                  error={errors.employment?.[index]?.supervisorName?.message}
                  placeholder="e.g., John Smith"
                />
                
                <Input
                  label="Supervisor Phone"
                  type="tel"
                  registration={register(`employment.${index}.supervisorPhone`)}
                  error={errors.employment?.[index]?.supervisorPhone?.message}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="form-label">Job Responsibilities</label>
                <textarea
                  {...register(`employment.${index}.responsibilities`)}
                  className="form-input min-h-[100px]"
                  placeholder="Describe your main duties and responsibilities..."
                />
                {errors.employment?.[index]?.responsibilities && (
                  <p className="form-error">{errors.employment[index]?.responsibilities?.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Reason for Leaving</label>
                <textarea
                  {...register(`employment.${index}.reasonForLeaving`)}
                  className="form-input min-h-[80px]"
                  placeholder="e.g., Career advancement, relocation, etc."
                />
                {errors.employment?.[index]?.reasonForLeaving && (
                  <p className="form-error">{errors.employment[index]?.reasonForLeaving?.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">May we contact this employer?</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="yes"
                      {...register(`employment.${index}.mayContact`)}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="no"
                      {...register(`employment.${index}.mayContact`)}
                      className="mr-2"
                    />
                    No
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