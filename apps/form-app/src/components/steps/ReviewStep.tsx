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
    // Personal Information (Step 0)
    legalFirstName: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    legalLastName: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    middleInitial: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    otherLastNames: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    dateOfBirth: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    socialSecurityNumber: { stepIndex: 0, stepNameKey: 'review.personal_info_title' },
    
    // Contact Information (Step 1)
    streetAddress: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    aptNumber: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    city: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    state: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    zipCode: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    phoneNumber: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    homePhone: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    email: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    emergencyName: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    emergencyPhone: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    emergencyRelationship: { stepIndex: 1, stepNameKey: 'review.contact_details_title' },
    
    // Citizenship/Work Authorization (Step 2)
    citizenshipStatus: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    uscisANumber: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    workAuthExpiration: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    alienDocumentType: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    alienDocumentNumber: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    i94AdmissionNumber: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    foreignPassportNumber: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    foreignPassportCountry: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    age18: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    transportation: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    workAuthorizationConfirm: { stepIndex: 2, stepNameKey: 'review.work_authorization_title' },
    
    // Position & Experience (Step 3)
    positionApplied: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    expectedSalary: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    jobDiscovery: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    
    // Forklift Certification (Step 3)
    forkliftCertification: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    forkliftSD: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    forkliftSU: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    forkliftSUR: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    forkliftCP: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    forkliftCL: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    forkliftRidingJack: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    
    // Skills & Qualifications (Step 3)
    skills1: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    skills2: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    skills3: { stepIndex: 3, stepNameKey: 'review.position_experience_title' },
    
    // Availability (Step 4)
    fullTimeEmployment: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    swingShifts: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    graveyardShifts: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    previouslyApplied: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    previousApplicationWhen: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    // Weekly availability fields
    availabilitySunday: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    availabilityMonday: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    availabilityTuesday: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    availabilityWednesday: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    availabilityThursday: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    availabilityFriday: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    availabilitySaturday: { stepIndex: 4, stepNameKey: 'review.availability_title' },
    
    // Education & Employment (Step 5)
    education: { stepIndex: 5, stepNameKey: 'review.education_employment_title' },
    employment: { stepIndex: 5, stepNameKey: 'review.education_employment_title' },
    
    // Documents (Step 6)
    documents: { stepIndex: 6, stepNameKey: 'review.documents_title' },
  }

  // Get specific error details for display with better field names
  const fieldDisplayNames: Record<string, string> = {
    legalFirstName: 'First Name',
    legalLastName: 'Last Name',
    socialSecurityNumber: 'Social Security Number',
    streetAddress: 'Street Address',
    city: 'City',
    state: 'State',
    zipCode: 'ZIP Code',
    phoneNumber: 'Phone Number',
    email: 'Email Address',
    citizenshipStatus: 'Citizenship Status',
    uscisANumber: 'USCIS A-Number',
    workAuthExpiration: 'Work Authorization Expiration',
    alienDocumentType: 'Document Type',
    alienDocumentNumber: 'USCIS A-Number',
    i94AdmissionNumber: 'Form I-94 Admission Number',
    foreignPassportNumber: 'Foreign Passport Number',
    foreignPassportCountry: 'Country of Issuance',
    previousApplicationWhen: 'Previous Application Details'
  }

  const errorDetails = Object.entries(errors).map(([fieldName, error]) => {
    const stepInfo = fieldToStep[fieldName] || { stepIndex: -1, stepNameKey: 'review.personal_info_title' }
    const displayName = fieldDisplayNames[fieldName] || fieldName
    return {
      fieldName,
      displayName,
      message: error.message || `${displayName} is required`,
      stepIndex: stepInfo.stepIndex,
      stepName: t(stepInfo.stepNameKey)
    }
  })

  // Get document category title for display
  const getDocumentCategoryTitle = (doc: any): string => {
    const category = doc.category || (doc.type === 'identification' ? 'id' : doc.type === 'resume' ? 'resume' : 'certification')
    
    switch (category) {
      case 'id':
        return 'Government ID'
      case 'resume':
        return 'Resume'
      case 'forkliftSD-cert':
        return 'SD - Sit Down Forklift Certification'
      case 'forkliftSU-cert':
        return 'SU - Stand Up Forklift Certification'
      case 'forkliftSUR-cert':
        return 'SUR - Stand Up Reach Certification'
      case 'forkliftCP-cert':
        return 'CP - Cherry Picker Certification'
      case 'forkliftCL-cert':
        return 'CL - Clamps Certification'
      case 'forkliftRidingJack-cert':
        return 'Riding Jack Certification'
      case 'skills1-cert':
      case 'skills2-cert':
      case 'skills3-cert':
        return 'Skills Certification'
      default:
        return 'Document'
    }
  }

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
            {errorDetails.map(({ fieldName, displayName, message, stepIndex, stepName }) => (
              <div key={fieldName} className="flex items-center justify-between bg-red-100 rounded-md p-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">{stepName}</p>
                  <p className="text-xs text-red-700">
                    <span className="font-medium">{displayName}:</span> {message}
                  </p>
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
            <span className="font-medium">{t('review.ssn_label')}</span>
            <p>{formData.socialSecurityNumber || t('review.not_provided')}</p>
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
        <div className="text-sm space-y-2">
          <div>
            <span className="font-medium">{t('review.citizenship_status_label')}</span>
            <p>{formData.citizenshipStatus || t('review.not_provided')}</p>
          </div>
          
          {/* Conditional fields based on citizenship status */}
          {formData.citizenshipStatus === 'lawful_permanent' && (
            <div>
              <span className="font-medium">USCIS A-Number *</span>
              <p>{formData.uscisANumber || t('review.not_provided')}</p>
            </div>
          )}
          
          {formData.citizenshipStatus === 'alien_authorized' && (
            <>
              <div>
                <span className="font-medium">Work Authorization Expiration *</span>
                <p>{formData.workAuthExpiration || t('review.not_provided')}</p>
              </div>
              <div>
                <span className="font-medium">Document Type *</span>
                <p>{formData.alienDocumentType || t('review.not_provided')}</p>
              </div>
              
              {formData.alienDocumentType === 'uscis_a_number' && (
                <div>
                  <span className="font-medium">USCIS A-Number *</span>
                  <p>{formData.alienDocumentNumber || t('review.not_provided')}</p>
                </div>
              )}
              
              {formData.alienDocumentType === 'form_i94' && (
                <div>
                  <span className="font-medium">Form I-94 Admission Number *</span>
                  <p>{formData.i94AdmissionNumber || t('review.not_provided')}</p>
                </div>
              )}
              
              {formData.alienDocumentType === 'foreign_passport' && (
                <>
                  <div>
                    <span className="font-medium">Foreign Passport Number *</span>
                    <p>{formData.foreignPassportNumber || t('review.not_provided')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Country of Issuance *</span>
                    <p>{formData.foreignPassportCountry || t('review.not_provided')}</p>
                  </div>
                </>
              )}
            </>
          )}
          
          {/* Basic eligibility questions */}
          {formData.age18 && (
            <div>
              <span className="font-medium">Are you 18 years of age or older?</span>
              <p>{formData.age18}</p>
            </div>
          )}
          {formData.transportation && (
            <div>
              <span className="font-medium">Do you have reliable transportation?</span>
              <p>{formData.transportation}</p>
            </div>
          )}
          {formData.workAuthorizationConfirm && (
            <div>
              <span className="font-medium">Are you authorized to work in the US?</span>
              <p>{formData.workAuthorizationConfirm}</p>
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

      {/* Forklift Certification */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">Forklift Certification</h3>
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
            <span className="font-medium">Do you have forklift certification?</span>
            <p>{formData.forkliftCertification || t('review.not_provided')}</p>
          </div>
          
          {formData.forkliftCertification === 'yes' && (
            <div>
              <span className="font-medium">Certified Forklift Types:</span>
              <div className="mt-2 space-y-1">
                {formData.forkliftSD && <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>SD - Sit Down Forklift</span></div>}
                {formData.forkliftSU && <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>SU - Stand Up Forklift</span></div>}
                {formData.forkliftSUR && <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>SUR - Stand Up Reach</span></div>}
                {formData.forkliftCP && <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>CP - Cherry Picker</span></div>}
                {formData.forkliftCL && <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>CL - Clamps</span></div>}
                {formData.forkliftRidingJack && <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>Riding Jack</span></div>}
                {!formData.forkliftSD && !formData.forkliftSU && !formData.forkliftSUR && !formData.forkliftCP && !formData.forkliftCL && !formData.forkliftRidingJack && (
                  <p className="text-gray-500">No specific forklift types selected</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skills & Qualifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">Skills & Qualifications</h3>
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
          {(formData.skills1 || formData.skills2 || formData.skills3) ? (
            <div className="space-y-2">
              {formData.skills1 && (
                <div>
                  <span className="font-medium">Skill 1:</span>
                  <p>{formData.skills1}</p>
                </div>
              )}
              {formData.skills2 && (
                <div>
                  <span className="font-medium">Skill 2:</span>
                  <p>{formData.skills2}</p>
                </div>
              )}
              {formData.skills3 && (
                <div>
                  <span className="font-medium">Skill 3:</span>
                  <p>{formData.skills3}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No skills or qualifications provided</p>
          )}
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
            <span className="font-medium">Swing Shifts</span>
            <p>{formData.swingShifts || t('review.not_provided')}</p>
          </div>
          <div>
            <span className="font-medium">Graveyard Shifts</span>
            <p>{formData.graveyardShifts || t('review.not_provided')}</p>
          </div>
          <div>
            <span className="font-medium">{t('review.previously_applied_label')}</span>
            <p>{formData.previouslyApplied || t('review.not_provided')}</p>
          </div>
          
          {/* Conditional field for previous application details */}
          {formData.previouslyApplied === 'yes' && (
            <div>
              <span className="font-medium">Previous Application Details *</span>
              <p>{formData.previousApplicationWhen || t('review.not_provided')}</p>
            </div>
          )}
          
          {/* Weekly Availability Schedule */}
          {(formData.availabilitySunday || formData.availabilityMonday || formData.availabilityTuesday || 
            formData.availabilityWednesday || formData.availabilityThursday || formData.availabilityFriday || 
            formData.availabilitySaturday) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="font-medium">Weekly Availability:</span>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {formData.availabilitySunday && <div><strong>Sunday:</strong> {formData.availabilitySunday}</div>}
                {formData.availabilityMonday && <div><strong>Monday:</strong> {formData.availabilityMonday}</div>}
                {formData.availabilityTuesday && <div><strong>Tuesday:</strong> {formData.availabilityTuesday}</div>}
                {formData.availabilityWednesday && <div><strong>Wednesday:</strong> {formData.availabilityWednesday}</div>}
                {formData.availabilityThursday && <div><strong>Thursday:</strong> {formData.availabilityThursday}</div>}
                {formData.availabilityFriday && <div><strong>Friday:</strong> {formData.availabilityFriday}</div>}
                {formData.availabilitySaturday && <div><strong>Saturday:</strong> {formData.availabilitySaturday}</div>}
              </div>
            </div>
          )}
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
          {/* Education Entries */}
          <div>
            <span className="font-medium">{t('review.education_entries_label')} ({formData.education?.length || 0})</span>
            {formData.education && formData.education.length > 0 ? (
              <div className="mt-2 space-y-3">
                {formData.education.map((edu: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><strong>School:</strong> {edu.schoolName}</div>
                      <div><strong>Year:</strong> {edu.graduationYear}</div>
                      <div><strong>Field:</strong> {edu.fieldOfStudy}</div>
                      <div><strong>Degree:</strong> {edu.degreeReceived === 'yes' ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-1">No education entries provided</p>
            )}
          </div>
          
          {/* Employment Entries */}
          <div>
            <span className="font-medium">{t('review.employment_entries_label')} ({formData.employment?.length || 0})</span>
            {formData.employment && formData.employment.length > 0 ? (
              <div className="mt-2 space-y-3">
                {formData.employment.map((emp: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="space-y-1 text-xs">
                      <div><strong>Company:</strong> {emp.companyName}</div>
                      <div><strong>Position:</strong> {emp.jobTitle}</div>
                      <div><strong>Duration:</strong> {emp.startDate} - {emp.endDate || 'Present'}</div>
                      <div><strong>Supervisor:</strong> {emp.supervisorName} ({emp.supervisorPhone})</div>
                      {emp.responsibilities && <div><strong>Responsibilities:</strong> {emp.responsibilities}</div>}
                      {emp.reasonLeaving && <div><strong>Reason for leaving:</strong> {emp.reasonLeaving}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-1">No employment entries provided</p>
            )}
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
                      <p className="text-xs font-medium text-primary">{getDocumentCategoryTitle(doc)}</p>
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