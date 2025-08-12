import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '@/shared/validation/schemas'
import { Upload, Eye, Download, Info, X } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { translateKey } from '../../types/translations'

interface DocumentsStepProps {
  form: UseFormReturn<ValidatedApplicationData>
}

export function DocumentsStep({ form }: DocumentsStepProps) {
  const { register, formState: { errors }, setValue, watch } = form
  const { t } = useLanguage()
  const documents = watch('documents') || []
  
  // Group documents by category for display
  const documentsByCategory = documents.reduce((acc: {[key: string]: any[]}, doc) => {
    // Backward compatibility: if no category, infer from type
    let category = doc.category
    if (!category) {
      if (doc.type === 'identification') category = 'id'
      else if (doc.type === 'resume') category = 'resume'
      else category = 'certification'
    }
    
    if (!acc[category]) acc[category] = []
    acc[category].push(doc)
    return acc
  }, {})
  
  // Watch for forklift certifications
  const forkliftSD = watch('forkliftSD')
  const forkliftSU = watch('forkliftSU') 
  const forkliftSUR = watch('forkliftSUR')
  const forkliftCP = watch('forkliftCP')
  const forkliftCL = watch('forkliftCL')
  const forkliftRidingJack = watch('forkliftRidingJack')
  
  const certifiedForklifts = [
    { key: 'forkliftSD', value: forkliftSD, label: 'SD - Sit Down Forklift' },
    { key: 'forkliftSU', value: forkliftSU, label: 'SU - Stand Up Forklift' },
    { key: 'forkliftSUR', value: forkliftSUR, label: 'SUR - Stand Up Reach' },
    { key: 'forkliftCP', value: forkliftCP, label: 'CP - Cherry Picker' },
    { key: 'forkliftCL', value: forkliftCL, label: 'CL - Clamps' },
    { key: 'forkliftRidingJack', value: forkliftRidingJack, label: 'Riding Jack' }
  ].filter(forklift => forklift.value === true)

  // Watch for certified skills
  const skills1 = watch('skills1')
  const skills2 = watch('skills2')
  const skills3 = watch('skills3')
  const skills1Certified = watch('skills1Certified')
  const skills2Certified = watch('skills2Certified')
  const skills3Certified = watch('skills3Certified')
  
  const certifiedSkills = [
    { key: 'skills1', value: skills1, certified: skills1Certified },
    { key: 'skills2', value: skills2, certified: skills2Certified },
    { key: 'skills3', value: skills3, certified: skills3Certified }
  ].filter(skill => skill.certified && skill.value && skill.value.trim() !== '')
   .map(skill => ({ key: skill.key, value: skill.value, label: skill.value }))

  // Create File object from document data for preview/download
  const createFileFromDocument = (doc: any): File => {
    try {
      const byteString = atob(doc.data)
      const arrayBuffer = new ArrayBuffer(byteString.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i)
      }
      
      const blob = new Blob([arrayBuffer], { type: doc.mimeType })
      return new File([blob], doc.name, { type: doc.mimeType })
    } catch (error) {
      console.error('Failed to create file from document:', doc.name, error)
      throw error
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1] // Remove data URL prefix
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Get document type from category
  const getDocumentType = (category: string): 'identification' | 'resume' | 'certification' => {
    if (category === 'id') return 'identification'
    if (category === 'resume') return 'resume'
    return 'certification'
  }

  // Get allowed file types based on category
  const getAllowedFileTypes = (category: string): string[] => {
    if (category === 'id') {
      // ID documents: JPEG, JPG, PNG
      return ['image/jpeg', 'image/jpg', 'image/png']
    } else if (category === 'resume' || category.includes('-cert')) {
      // Resume and certifications: PDF, DOC, DOCX, and images
      return [
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'image/jpeg',
        'image/jpg', 
        'image/png'
      ]
    }
    // Default to ID requirements
    return ['image/jpeg', 'image/jpg', 'image/png']
  }

  // Get accept attribute string for file inputs
  const getAcceptString = (category: string): string => {
    if (category === 'id') {
      return '.jpg,.jpeg,.png,image/jpeg,image/png'
    } else if (category === 'resume' || category.includes('-cert')) {
      return '.pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png'
    }
    return '.jpg,.jpeg,.png,image/jpeg,image/png'
  }

  // Get error message for invalid file types
  const getFileTypeErrorMessage = (category: string): string => {
    if (category === 'id') {
      return t('documents.file_errors.id_only_images_allowed') || 'Only JPEG, JPG, or PNG image files are allowed for ID documents'
    } else if (category === 'resume') {
      return t('documents.file_errors.resume_only_docs_allowed') || 'Only PDF, DOC, DOCX, JPEG, JPG, or PNG files are allowed for resumes'
    } else if (category.includes('-cert')) {
      return t('documents.file_errors.cert_only_docs_allowed') || 'Only PDF, DOC, DOCX, JPEG, JPG, or PNG files are allowed for certifications'
    }
    return 'Invalid file type'
  }

  // Get file type instructions
  const getFileTypeInstructions = (category: string): string => {
    if (category === 'id') {
      return t('documents.id_instructions') || 'Please upload your ID document as JPEG, JPG, or PNG image file.'
    } else {
      return t('documents.docs_instructions') || 'Please upload your document as a PDF, DOC, or DOCX file.'
    }
  }

  const handleFileUpload = async (category: string, files: FileList) => {
    const fileArray = Array.from(files)
    
    // Validate file types based on category
    const allowedTypes = getAllowedFileTypes(category)
    const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      const errorMessage = getFileTypeErrorMessage(category)
      alert(`${errorMessage}\n\n${getFileTypeInstructions(category)}`)
      return
    }
    
    // Check file sizes
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert(`${t('documents.file_errors.file_too_large')}: ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }
    
    // Convert new files to document format
    const newDocuments = await Promise.all(
      fileArray.map(async (file) => {
        const base64Data = await fileToBase64(file)
        return {
          type: getDocumentType(category),
          category: category,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          data: base64Data
        }
      })
    )
    
    // Add to existing documents
    const updatedDocuments = [...documents, ...newDocuments]
    setValue('documents', updatedDocuments, { shouldValidate: true })
  }

  const removeDocument = (category: string, index: number) => {
    const categoryDocs = documentsByCategory[category] || []
    const docToRemove = categoryDocs[index]
    
    if (docToRemove) {
      const updatedDocuments = documents.filter(doc => 
        !(doc.category === category && doc.name === docToRemove.name && doc.data === docToRemove.data)
      )
      setValue('documents', updatedDocuments, { shouldValidate: true })
    }
  }

  const previewDocument = (doc: any) => {
    try {
      const file = createFileFromDocument(doc)
      if (doc.mimeType.startsWith('image/') || doc.mimeType === 'application/pdf') {
        const url = URL.createObjectURL(file)
        window.open(url, '_blank')
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (error) {
      console.error('Error previewing document:', error)
    }
  }
  
  const downloadDocument = (doc: any) => {
    try {
      const file = createFileFromDocument(doc)
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const renderDocumentList = (category: string, docs: any[]) => {
    return (
      <div className="mt-3 space-y-2">
        {docs.map((doc, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white text-xs font-medium">{doc.name.split('.').pop()?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{doc.name}</p>
                <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => previewDocument(doc)}
                className="text-primary hover:text-primary-dark p-1"
                title={t('documents.preview')}
              >
                <Eye size={16} />
              </button>
              <button
                type="button"
                onClick={() => downloadDocument(doc)}
                className="text-primary hover:text-primary-dark p-1"
                title={t('documents.download')}
              >
                <Download size={16} />
              </button>
              <button
                type="button"
                onClick={() => removeDocument(category, index)}
                className="text-red-600 hover:text-red-800 p-1"
                title={t('documents.remove')}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }


  return (
    <div className="space-y-6 relative">
      

      <div className="space-y-6">
        {/* Government ID */}
        <div>
          <label className="form-label">
            {t('documents.id_label')} <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="id-upload" className="cursor-pointer">
                <span className="btn-primary inline-block">{t('documents.choose_file')}</span>
                <input
                  id="id-upload"
                  type="file"
                  accept={getAcceptString('id')}
                  multiple
                  className="sr-only"
                  onChange={(e) => e.target.files && handleFileUpload('id', e.target.files)}
                />
              </label>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <p>{t('documents.id_description')}</p>
              <p className="mt-1 text-xs text-blue-600">{t('documents.id_file_types') || 'Accepts: JPEG, JPG, PNG image files'}</p>
            </div>
          </div>
          {documentsByCategory['id'] && renderDocumentList('id', documentsByCategory['id'])}
        </div>

        {/* Resume */}
        <div>
          <label className="form-label">
            {t('documents.resume_label')}
          </label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="resume-upload" className="cursor-pointer">
                <span className="btn-secondary inline-block">{t('documents.choose_file')}</span>
                <input
                  id="resume-upload"
                  type="file"
                  accept={getAcceptString('resume')}
                  multiple
                  className="sr-only"
                  onChange={(e) => e.target.files && handleFileUpload('resume', e.target.files)}
                />
              </label>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <p>{t('documents.resume_description')}</p>
              <p className="mt-1 text-xs text-blue-600">{t('documents.resume_file_types') || 'Accepts: PDF, DOC, DOCX files'}</p>
            </div>
          </div>
          {documentsByCategory['resume'] && renderDocumentList('resume', documentsByCategory['resume'])}
        </div>


        {/* Certifications - Dynamic based on selections */}
        {(certifiedForklifts.length > 0 || certifiedSkills.length > 0) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-primary mb-4">{t('documents.certifications_title')}</h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('documents.certifications_description')}
            </p>
            
            <div className="space-y-6">
              {/* Forklift Certifications */}
              {certifiedForklifts.map((forklift) => (
                <div key={forklift.key}>
                  <label className="form-label">
                    {forklift.label} Certification
                  </label>
                  <div className="mt-2 border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary transition-colors bg-primary/5">
                    <Upload className="mx-auto h-12 w-12 text-primary" />
                    <div className="mt-4">
                      <label htmlFor={`${forklift.key}-cert-upload`} className="cursor-pointer">
                        <span className="btn-primary inline-block">{t('documents.upload_certification')}</span>
                        <input
                          id={`${forklift.key}-cert-upload`}
                          type="file"
                          accept={getAcceptString(`${forklift.key}-cert`)}
                          multiple
                          className="sr-only"
                          onChange={(e) => e.target.files && handleFileUpload(`${forklift.key}-cert`, e.target.files)}
                        />
                      </label>
                    </div>
                    <div className="mt-2 text-sm text-primary">
                      <p>Upload your official {forklift.label.toLowerCase()} certification documents</p>
                      <p className="text-xs text-blue-600 mt-1">{t('documents.cert_file_types') || 'Accepts: PDF, DOC, DOCX files'}</p>
                    </div>
                  </div>
                  {documentsByCategory[`${forklift.key}-cert`] && renderDocumentList(`${forklift.key}-cert`, documentsByCategory[`${forklift.key}-cert`])}
                </div>
              ))}

              {/* Skills Certifications */}
              {certifiedSkills.map((skill) => (
                <div key={skill.key}>
                  <label className="form-label">
                    {skill.label} {t('documents.certification_label')}
                  </label>
                  <div className="mt-2 border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary transition-colors bg-primary/5">
                    <Upload className="mx-auto h-12 w-12 text-primary" />
                    <div className="mt-4">
                      <label htmlFor={`${skill.key}-cert-upload`} className="cursor-pointer">
                        <span className="btn-primary inline-block">{t('documents.upload_certification')}</span>
                        <input
                          id={`${skill.key}-cert-upload`}
                          type="file"
                          accept={getAcceptString(`${skill.key}-cert`)}
                          multiple
                          className="sr-only"
                          onChange={(e) => e.target.files && handleFileUpload(`${skill.key}-cert`, e.target.files)}
                        />
                      </label>
                    </div>
                    <div className="mt-2 text-sm text-primary">
                      <p>{t('documents.documentation_for')} {skill.label}</p>
                      <p className="text-xs text-blue-600 mt-1">{t('documents.cert_file_types') || 'Accepts: PDF, DOC, DOCX files'}</p>
                    </div>
                  </div>
                  {documentsByCategory[`${skill.key}-cert`] && renderDocumentList(`${skill.key}-cert`, documentsByCategory[`${skill.key}-cert`])}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}