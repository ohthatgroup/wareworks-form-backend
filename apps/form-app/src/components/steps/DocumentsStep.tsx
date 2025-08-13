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
  const [draggedOver, setDraggedOver] = React.useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = React.useState<{[key: string]: number}>({})
  const [isUploading, setIsUploading] = React.useState(false)
  
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
    
    // Smart file size limits based on document type
    let maxFileSize: number
    if (category === 'resume') {
      maxFileSize = 1 * 1024 * 1024 // 1MB for resume (can be larger document)
    } else if (category.includes('-cert')) {
      maxFileSize = 0.5 * 1024 * 1024 // 500KB for certifications (usually smaller)
    } else {
      maxFileSize = 2 * 1024 * 1024 // 2MB default (ID documents)
    }
    
    const oversizedFiles = fileArray.filter(file => file.size > maxFileSize)
    if (oversizedFiles.length > 0) {
      const limitMB = maxFileSize >= 1024 * 1024 ? Math.round(maxFileSize / 1024 / 1024 * 10) / 10 : Math.round(maxFileSize / 1024) + 'KB'
      const oversizedList = oversizedFiles.map(f => `${f.name} (${Math.round(f.size / 1024 / 1024 * 10) / 10}MB)`).join('\n')
      alert(`Files too large - maximum ${limitMB} per ${category === 'resume' ? 'resume' : category.includes('-cert') ? 'certification' : 'file'}:\n\n${oversizedList}\n\nPlease compress your files and try again.`)
      return
    }
    
    // Hard total limit: 5MB across all uploads to ensure email delivery
    const totalLimit = 5 * 1024 * 1024 // 5MB total
    const totalSizeThisUpload = fileArray.reduce((sum, file) => sum + file.size, 0)
    const existingDocsSize = (documents || []).reduce((sum, doc) => sum + doc.size, 0)
    
    if (existingDocsSize + totalSizeThisUpload > totalLimit) {
      const currentTotal = Math.round((existingDocsSize + totalSizeThisUpload) / 1024 / 1024 * 10) / 10
      alert(`Total document size would be ${currentTotal}MB, which exceeds the 5MB limit.\n\nTo stay under the limit:\n• Compress existing files\n• Remove some documents\n• Use smaller file formats`)
      return
    }
    
    // Basic file corruption check
    const corruptFiles = fileArray.filter(file => file.size === 0 || file.name.length === 0)
    if (corruptFiles.length > 0) {
      alert(`Some files appear to be corrupted or empty:\n${corruptFiles.map(f => f.name).join(', ')}\n\nPlease check your files and try again.`)
      return
    }
    
    // Process files through backend validation with progress tracking
    const newDocuments = []
    setIsUploading(true)
    setUploadProgress({})
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const progressKey = `${category}-${file.name}`
      
      try {
        // Update progress - processing file
        setUploadProgress(prev => ({ ...prev, [progressKey]: 10 }))
        
        // Convert to base64 with progress
        const base64Data = await fileToBase64(file)
        setUploadProgress(prev => ({ ...prev, [progressKey]: 50 }))
        
        // Call backend upload function for validation
        const uploadResponse = await fetch('/.netlify/functions/upload-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: `${Date.now()}_${file.name}`,
            data: base64Data,
            contentType: file.type,
            category: category
          })
        })
        
        setUploadProgress(prev => ({ ...prev, [progressKey]: 80 }))
        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          // Handle specific error cases with detailed messages
          let errorMessage = 'Upload failed'
          
          if (uploadResponse.status === 413) {
            errorMessage = 'File too large for server processing'
          } else if (uploadResponse.status === 415) {
            errorMessage = 'File type not supported'
          } else if (uploadResponse.status === 400) {
            if (uploadResult.errorKey === 'file_too_large') {
              errorMessage = `File too large (max 2MB allowed)`
            } else if (uploadResult.errorKey === 'invalid_file_type') {
              errorMessage = getFileTypeErrorMessage(category)
            } else {
              errorMessage = uploadResult.error || 'File validation failed'
            }
          } else if (uploadResponse.status >= 500) {
            errorMessage = 'Server error - please try again'
          } else {
            errorMessage = uploadResult.error || 'Upload failed'
          }
          
          alert(`${file.name}: ${errorMessage}`)
          setUploadProgress(prev => ({ ...prev, [progressKey]: -1 })) // Error state
          continue // Skip this file, continue with others
        }

        // File processed successfully
        const processedDocument = {
          type: getDocumentType(category),
          category: category,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          data: uploadResult.url && uploadResult.url.startsWith('data:') ? 
            uploadResult.url.split(',')[1] : // Extract base64 from data URL
            base64Data // Use original base64 data
        }

        setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }))
        console.log(`✅ Document uploaded: ${file.name} (${file.type})`)
        newDocuments.push(processedDocument)

      } catch (error) {
        console.error('File upload error:', error)
        let errorMessage = 'Upload failed'
        
        // Handle specific error types
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage = 'Network error - check your connection'
        } else if (error instanceof Error) {
          if (error.message.includes('base64')) {
            errorMessage = 'File appears to be corrupted'
          } else if (error.message.includes('timeout')) {
            errorMessage = 'Upload timed out - file may be too large'
          } else {
            errorMessage = error.message
          }
        }
        
        alert(`${file.name}: ${errorMessage}`)
        setUploadProgress(prev => ({ ...prev, [progressKey]: -1 })) // Error state
      }
    }
    
    // Clean up progress after a delay
    setTimeout(() => {
      setUploadProgress({})
      setIsUploading(false)
    }, 2000)
    
    if (newDocuments.length > 0) {
      // Add successfully processed documents
      const updatedDocuments = [...documents, ...newDocuments]
      setValue('documents', updatedDocuments, { shouldValidate: true })
    }
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

  // Drag and drop handlers that work in iframe
  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOver(category)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear if we're leaving the drop zone completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggedOver(null)
    }
  }

  const handleDrop = (e: React.DragEvent, category: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOver(null)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(category, files)
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


  // Calculate current usage and limits for display
  const maxCertifications = certifiedForklifts.length + certifiedSkills.length
  const currentTotalSize = (documents || []).reduce((sum, doc) => sum + doc.size, 0)
  const totalLimit = 5 * 1024 * 1024 // 5MB total limit
  const usagePercent = Math.round((currentTotalSize / totalLimit) * 100)

  return (
    <div className="space-y-6 relative">
      {/* Upload Usage Tracker */}
      {documents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-blue-900">Document Upload Status</h3>
            <span className="text-sm text-blue-700">
              {Math.round(currentTotalSize / 1024 / 1024 * 10) / 10}MB / {Math.round(totalLimit / 1024 / 1024)}MB
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-blue-600 mt-1">
            <span>Resume: 1MB max • Certs: 500KB max</span>
            <span>{documents.length} files uploaded</span>
            {maxCertifications > 0 && (
              <span>{maxCertifications} certifications selected</span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Government ID */}
        <div>
          <label className="form-label">
            {t('documents.id_label')} <span className="text-red-500">*</span>
          </label>
          <div 
            className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              draggedOver === 'id' 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-300 hover:border-primary'
            }`}
            onDragOver={(e) => handleDragOver(e, 'id')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'id')}
          >
            <Upload className={`mx-auto h-12 w-12 ${draggedOver === 'id' ? 'text-primary' : 'text-gray-400'}`} />
            <div className="mt-4">
              <label htmlFor="id-upload" className="cursor-pointer">
                <span className={`btn-primary inline-block ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploading ? t('documents.uploading') || 'Uploading...' : t('documents.choose_file')}
                </span>
                <input
                  id="id-upload"
                  type="file"
                  accept={getAcceptString('id')}
                  multiple
                  disabled={isUploading}
                  className="sr-only"
                  onChange={(e) => e.target.files && handleFileUpload('id', e.target.files)}
                />
              </label>
            </div>
            
            {/* Progress indicator for ID uploads */}
            {Object.entries(uploadProgress).some(([key, _]) => key.startsWith('id-')) && (
              <div className="mt-2 space-y-1">
                {Object.entries(uploadProgress)
                  .filter(([key, _]) => key.startsWith('id-'))
                  .map(([key, progress]) => {
                    const fileName = key.split('-').slice(1).join('-')
                    return (
                      <div key={key} className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="truncate text-gray-600">{fileName}</span>
                          <span className="text-xs">
                            {progress === -1 ? '❌ Error' : progress === 100 ? '✅ Done' : `${progress}%`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              progress === -1 ? 'bg-red-500' : progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.max(0, progress)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500">
              <p>{draggedOver === 'id' ? t('documents.drop_files') || 'Drop files here' : t('documents.id_description')}</p>
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
          <div 
            className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              draggedOver === 'resume' 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-300 hover:border-primary'
            }`}
            onDragOver={(e) => handleDragOver(e, 'resume')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'resume')}
          >
            <Upload className={`mx-auto h-12 w-12 ${draggedOver === 'resume' ? 'text-primary' : 'text-gray-400'}`} />
            <div className="mt-4">
              <label htmlFor="resume-upload" className="cursor-pointer">
                <span className={`btn-secondary inline-block ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploading ? t('documents.uploading') || 'Uploading...' : t('documents.choose_file')}
                </span>
                <input
                  id="resume-upload"
                  type="file"
                  accept={getAcceptString('resume')}
                  multiple
                  disabled={isUploading}
                  className="sr-only"
                  onChange={(e) => e.target.files && handleFileUpload('resume', e.target.files)}
                />
              </label>
            </div>
            
            {/* Progress indicator for Resume uploads */}
            {Object.entries(uploadProgress).some(([key, _]) => key.startsWith('resume-')) && (
              <div className="mt-2 space-y-1">
                {Object.entries(uploadProgress)
                  .filter(([key, _]) => key.startsWith('resume-'))
                  .map(([key, progress]) => {
                    const fileName = key.split('-').slice(1).join('-')
                    return (
                      <div key={key} className="text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="truncate text-gray-600">{fileName}</span>
                          <span className="text-xs">
                            {progress === -1 ? '❌ Error' : progress === 100 ? '✅ Done' : `${progress}%`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              progress === -1 ? 'bg-red-500' : progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.max(0, progress)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500">
              <p>{draggedOver === 'resume' ? t('documents.drop_files') || 'Drop files here' : t('documents.resume_description')}</p>
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
                  <div 
                    className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      draggedOver === `${forklift.key}-cert`
                        ? 'border-primary bg-primary/20' 
                        : 'border-primary/30 hover:border-primary bg-primary/5'
                    }`}
                    onDragOver={(e) => handleDragOver(e, `${forklift.key}-cert`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, `${forklift.key}-cert`)}
                  >
                    <Upload className={`mx-auto h-12 w-12 ${draggedOver === `${forklift.key}-cert` ? 'text-primary-dark' : 'text-primary'}`} />
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
                      <p>{draggedOver === `${forklift.key}-cert` ? t('documents.drop_files') || 'Drop files here' : `Upload your official ${forklift.label.toLowerCase()} certification documents`}</p>
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
                  <div 
                    className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      draggedOver === `${skill.key}-cert`
                        ? 'border-primary bg-primary/20' 
                        : 'border-primary/30 hover:border-primary bg-primary/5'
                    }`}
                    onDragOver={(e) => handleDragOver(e, `${skill.key}-cert`)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, `${skill.key}-cert`)}
                  >
                    <Upload className={`mx-auto h-12 w-12 ${draggedOver === `${skill.key}-cert` ? 'text-primary-dark' : 'text-primary'}`} />
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
                      <p>{draggedOver === `${skill.key}-cert` ? t('documents.drop_files') || 'Drop files here' : `${t('documents.documentation_for')} ${skill.label}`}</p>
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