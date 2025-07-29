import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '@/shared/validation/schemas'
import { CheckCircle, AlertCircle, Edit, Eye, Download } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface ReviewStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  onEditStep?: (stepIndex: number) => void
}

export function ReviewStep({ form, onEditStep }: ReviewStepProps) {
  const { watch, formState: { errors } } = form
  const { t } = useLanguage()
  const formData = watch()

  const hasErrors = Object.keys(errors).length > 0

  const handleEdit = (stepIndex: number) => {
    if (onEditStep) {
      onEditStep(stepIndex)
    }
  }

  // Map field names to their respective steps for better error reporting
  const fieldToStep: Record<string, { stepIndex: number, stepNameKey: string }> = {
    legalFirstName: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    legalLastName: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    middleInitial: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    otherLastNames: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    dateOfBirth: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    socialSecurityNumber: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    streetAddress: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    city: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    state: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    zipCode: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    phoneNumber: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    email: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    emergencyName: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    emergencyPhone: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    citizenshipStatus: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    age18: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    transportation: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    workAuthorizationConfirm: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    positionApplied: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    jobDiscovery: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    fullTimeEmployment: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    swingShifts: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    graveyardShifts: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    previouslyApplied: { stepIndex: 4, stepNameKey: 'review.availability_title' },
  }

  // Get specific error details for display
  const errorDetails = Object.entries(errors).map(([fieldName, error]) => {
    const stepInfo = fieldToStep[fieldName] || { stepIndex: -1, stepNameKey: 'review.personal_info_title' }
    return {
      fieldName,
      message: error.message || 'This field is required',
      stepIndex: stepInfo.stepIndex,
      stepName: t(stepInfo.stepNameKey)
    }
  })

  const previewDocument = (doc: any) => {
    try {
      const byteCharacters = atob(doc.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: doc.mimeType })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error previewing document:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-4 ${
        hasErrors ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {hasErrors ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          <h3 className={`font-medium ${
            hasErrors ? 'text-red-900' : 'text-green-900'
          }`}>
            {hasErrors ? t('review.required_fields') : t('review.ready_submission')}
          </h3>
        </div>
        <p className={`text-sm ${
          hasErrors ? 'text-red-800' : 'text-green-800'
        }`}>
          {hasErrors 
            ? t('review.fix_issues')
            : t('review.all_provided')
          }
        </p>
        
        {/* Show specific validation errors */}
        {hasErrors && errorDetails.length > 0 && (
          <div className="mt-4 space-y-2">
            {errorDetails.map(({ fieldName, message, stepIndex, stepName }) => (
              <div key={fieldName} className="flex items-center justify-between bg-red-100 rounded-md p-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">{stepName}</p>
                  <p className="text-xs text-red-700">{message}</p>
                </div>
                {stepIndex >= 0 && (
                  <button
                    onClick={() => handleEdit(stepIndex)}
                    className="ml-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    {t('review.fix_button')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">{t('review.personal_info_title')}</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(0)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            {t('review.edit_button')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">{t('review.name_label')}</span>
            <p>{formData.legalFirstName} {formData.middleInitial} {formData.legalLastName}</p>
          </div>
          <div>
            <span className="font-medium">{t('review.date_of_birth_label')}</span>
            <p>{formData.dateOfBirth || t('review.not_provided')}</p>
          </div>
          <div>
            <span className="font-medium">{t('review.phone_label')}</span>
            <p>{formData.phoneNumber || t('review.not_provided')}</p>
          </div>
          <div>
            <span className="font-medium">{t('review.email_label')}</span>
            <p>{formData.email || t('review.not_provided')}</p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">{t('review.contact_details_title')}</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(1)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            {t('review.edit_button')}
          </button>
        </div>
        <div className="text-sm">
          <p>{formData.streetAddress} {formData.aptNumber}</p>
          <p>{formData.city}, {formData.state} {formData.zipCode}</p>
        </div>
      </div>

      {/* Work Authorization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">{t('review.work_authorization_title')}</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(2)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            {t('review.edit_button')}
          </button>
        </div>
        <div className="text-sm">
          <div>
            <span className="font-medium">{t('review.citizenship_status_label')}</span>
            <p>{formData.citizenshipStatus || t('review.not_provided')}</p>
          </div>
          {formData.workAuthorization && (
            <div className="mt-2">
              <span className="font-medium">{t('review.work_authorization_label')}</span>
              <p>{formData.workAuthorization}</p>
            </div>
          )}
        </div>
      </div>

      {/* Position & Experience */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">{t('review.position_experience_title')}</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(3)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            {t('review.edit_button')}
          </button>
        </div>
        <div className="text-sm space-y-2">
          <div>
            <span className="font-medium">{t('review.position_applied_label')}</span>
            <p>{formData.positionApplied || t('review.not_provided')}</p>
          </div>
          <div>
            <span className="font-medium">{t('review.expected_salary_label')}</span>
            <p>{formData.expectedSalary || t('review.not_provided')}</p>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">{t('review.availability_title')}</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(4)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            {t('review.edit_button')}
          </button>
        </div>
        <div className="text-sm space-y-2">
          <div>
            <span className="font-medium">{t('review.full_time_employment_label')}</span>
            <p>{formData.fullTimeEmployment || t('review.not_provided')}</p>
          </div>
          <div>
            <span className="font-medium">{t('review.previously_applied_label')}</span>
            <p>{formData.previouslyApplied || t('review.not_provided')}</p>
          </div>
        </div>
      </div>

      {/* Education & Employment */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">{t('review.education_employment_title')}</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(5)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            {t('review.edit_button')}
          </button>
        </div>
        <div className="text-sm space-y-4">
          <div>
            <span className="font-medium">{t('review.education_entries_label')}</span>
            <p>{formData.education?.length || 0} {t('review.entries_count')}</p>
          </div>
          <div>
            <span className="font-medium">{t('review.employment_entries_label')}</span>
            <p>{formData.employment?.length || 0} {t('review.entries_count')}</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">{t('review.documents_title')}</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(6)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            {t('review.edit_button')}
          </button>
        </div>
        <div className="text-sm space-y-3">
          {formData.documents && formData.documents.length > 0 ? (
            <div className="space-y-2">
              {formData.documents.map((doc: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{doc.name.split('.').pop()?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => previewDocument(doc)}
                      className="text-primary hover:text-primary-dark p-1"
                      title={t('review.preview_title')}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const byteCharacters = atob(doc.data)
                          const byteNumbers = new Array(byteCharacters.length)
                          for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i)
                          }
                          const byteArray = new Uint8Array(byteNumbers)
                          const blob = new Blob([byteArray], { type: doc.mimeType })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = doc.name
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        } catch (error) {
                          console.error('Error downloading document:', error)
                        }
                      }}
                      className="text-primary hover:text-primary-dark p-1"
                      title={t('review.download_title')}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">{t('review.no_documents')}</p>
          )}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{t('review.legal_acknowledgment_title')}</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            {t('review.legal_text_1')}
          </p>
          <p>
            {t('review.legal_text_2')}
          </p>
        </div>
      </div>
    </div>
  )
}