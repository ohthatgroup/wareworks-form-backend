import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { CheckCircle, AlertCircle, Edit, Eye, Download } from 'lucide-react'

interface ReviewStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
  onEditStep?: (stepIndex: number) => void
}

export function ReviewStep({ form, onEditStep }: ReviewStepProps) {
  const { watch, formState: { errors } } = form
  const formData = watch()

  const hasErrors = Object.keys(errors).length > 0

  const handleEdit = (stepIndex: number) => {
    if (onEditStep) {
      onEditStep(stepIndex)
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
            {hasErrors ? 'Please Review Required Fields' : 'Application Ready for Submission'}
          </h3>
        </div>
        <p className={`text-sm ${
          hasErrors ? 'text-red-800' : 'text-green-800'
        }`}>
          {hasErrors 
            ? 'Please go back and complete all required fields before submitting.'
            : 'All required information has been provided. Review your details below and submit when ready.'
          }
        </p>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">Personal Information</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(0)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Name:</span>
            <p>{formData.legalFirstName} {formData.middleInitial} {formData.legalLastName}</p>
          </div>
          <div>
            <span className="font-medium">Date of Birth:</span>
            <p>{formData.dateOfBirth || 'Not provided'}</p>
          </div>
          <div>
            <span className="font-medium">Phone:</span>
            <p>{formData.phoneNumber || 'Not provided'}</p>
          </div>
          <div>
            <span className="font-medium">Email:</span>
            <p>{formData.email || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">Contact Details</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(1)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
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
          <h3 className="font-semibold text-primary">Work Authorization</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(2)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
        </div>
        <div className="text-sm">
          <div>
            <span className="font-medium">Citizenship Status:</span>
            <p>{formData.citizenshipStatus || 'Not provided'}</p>
          </div>
          {formData.workAuthorization && (
            <div className="mt-2">
              <span className="font-medium">Work Authorization:</span>
              <p>{formData.workAuthorization}</p>
            </div>
          )}
        </div>
      </div>

      {/* Position & Experience */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">Position & Experience</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(3)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
        </div>
        <div className="text-sm space-y-2">
          <div>
            <span className="font-medium">Position Applied For:</span>
            <p>{formData.positionApplied || 'Not provided'}</p>
          </div>
          <div>
            <span className="font-medium">Expected Salary:</span>
            <p>{formData.expectedSalary || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">Availability</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(4)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
        </div>
        <div className="text-sm space-y-2">
          <div>
            <span className="font-medium">Full-time Employment:</span>
            <p>{formData.fullTimeEmployment || 'Not provided'}</p>
          </div>
          <div>
            <span className="font-medium">Previously Applied:</span>
            <p>{formData.previouslyApplied || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Education & Employment */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">Education & Employment</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(5)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
        </div>
        <div className="text-sm space-y-4">
          <div>
            <span className="font-medium">Education Entries:</span>
            <p>{formData.education?.length || 0} entries</p>
          </div>
          <div>
            <span className="font-medium">Employment Entries:</span>
            <p>{formData.employment?.length || 0} entries</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-primary">Documents</h3>
          <button 
            type="button" 
            onClick={() => handleEdit(6)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Edit size={16} />
            Edit
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
                      title="Preview"
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
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No documents uploaded yet.</p>
          )}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Legal Acknowledgment</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            By submitting this application, I certify that all information provided is true and complete to the best of my knowledge. I understand that any false information may result in disqualification from employment or termination if hired.
          </p>
          <p>
            I authorize WareWorks to verify the information provided and to conduct background checks as permitted by law.
          </p>
        </div>
      </div>
    </div>
  )
}