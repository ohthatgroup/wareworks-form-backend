import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '../../shared/validation/schemas'
import { Upload, X, Eye, Download } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

interface DocumentsStepProps {
  form: UseFormReturn<ValidatedApplicationData>
  isSubmitting: boolean
}

export function DocumentsStep({ form }: DocumentsStepProps) {
  const { register, formState: { errors }, setValue, watch } = form
  const { t } = useLanguage()
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({})
  const documents = watch('documents') || []
  
  // Watch for certified equipment
  const equipmentSD = watch('equipmentSD')
  const equipmentSU = watch('equipmentSU') 
  const equipmentSUR = watch('equipmentSUR')
  const equipmentCP = watch('equipmentCP')
  const equipmentCL = watch('equipmentCL')
  const equipmentRidingJack = watch('equipmentRidingJack')
  
  const certifiedEquipment = [
    { key: 'equipmentSD', value: equipmentSD, labelKey: 'equipment.sd_label' },
    { key: 'equipmentSU', value: equipmentSU, labelKey: 'equipment.su_label' },
    { key: 'equipmentSUR', value: equipmentSUR, labelKey: 'equipment.sur_label' },
    { key: 'equipmentCP', value: equipmentCP, labelKey: 'equipment.cp_label' },
    { key: 'equipmentCL', value: equipmentCL, labelKey: 'equipment.cl_label' },
    { key: 'equipmentRidingJack', value: equipmentRidingJack, labelKey: 'equipment.riding_jack_label' }
  ].filter(equipment => equipment.value === 'certified')

  // Watch for certified skills (this would need to be implemented in the skills component)
  // For now, this is placeholder for when skills certification is implemented
  const certifiedSkills: { key: string; value: string; label: string }[] = []

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

  // Debounced file conversion to prevent UI blocking
  const convertFilesWithDelay = async (files: File[], existingFiles: File[]): Promise<any[]> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const allFiles = [...existingFiles, ...files]
        const convertedDocuments = await Promise.all(
          allFiles.map(async (file) => {
            const base64Data = await fileToBase64(file)
            return {
              type: getFileType(file),
              name: file.name,
              size: file.size,
              mimeType: file.type,
              data: base64Data
            }
          })
        )
        resolve(convertedDocuments)
      }, 100) // Small delay to prevent UI blocking
    })
  }

  const getFileType = (file: File): 'identification' | 'resume' | 'certification' => {
    const fileCategory = Object.keys(uploadedFiles).find(key => 
      uploadedFiles[key].includes(file)
    )
    
    if (fileCategory === 'id') return 'identification'
    if (fileCategory === 'resume') return 'resume'
    return 'certification'
  }

  const handleFileUpload = async (type: string, files: FileList) => {
    const fileArray = Array.from(files)
    const newFiles = { ...uploadedFiles }
    
    if (!newFiles[type]) {
      newFiles[type] = []
    }
    
    const existingFiles = newFiles[type] || []
    newFiles[type] = [...existingFiles, ...fileArray]
    setUploadedFiles(newFiles)
    
    // Use debounced conversion to prevent UI blocking
    const convertedDocuments = await convertFilesWithDelay(fileArray, existingFiles)
    setValue('documents', convertedDocuments)
  }

  const removeFile = async (type: string, index: number) => {
    const newFiles = { ...uploadedFiles }
    newFiles[type].splice(index, 1)
    
    if (newFiles[type].length === 0) {
      delete newFiles[type]
    }
    
    setUploadedFiles(newFiles)
    
    // Convert remaining files to schema format
    const allFiles = Object.values(newFiles).flat()
    const convertedDocuments = await convertFilesWithDelay([], allFiles)
    setValue('documents', convertedDocuments)
  }

  const previewFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      window.open(url, '_blank')
    } else if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file)
      window.open(url, '_blank')
    }
  }

  const renderFileList = (type: string, files: File[]) => {
    return (
      <div className="mt-3 space-y-2">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white text-xs font-medium">{file.name.split('.').pop()?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => previewFile(file)}
                className="text-primary hover:text-primary-dark p-1"
                title={t('documents.preview')}
              >
                <Eye size={16} />
              </button>
              <a
                href={URL.createObjectURL(file)}
                download={file.name}
                className="text-primary hover:text-primary-dark p-1"
                title={t('documents.download')}
              >
                <Download size={16} />
              </a>
              <button
                type="button"
                onClick={() => removeFile(type, index)}
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
    <div className="space-y-6">

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
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(e) => e.target.files && handleFileUpload('id', e.target.files)}
                />
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {t('documents.id_description')}
            </p>
          </div>
          {uploadedFiles['id'] && renderFileList('id', uploadedFiles['id'])}
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
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  onChange={(e) => e.target.files && handleFileUpload('resume', e.target.files)}
                />
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {t('documents.resume_description')}
            </p>
          </div>
          {uploadedFiles['resume'] && renderFileList('resume', uploadedFiles['resume'])}
        </div>


        {/* Certifications - Dynamic based on selections */}
        {(certifiedEquipment.length > 0 || certifiedSkills.length > 0) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-primary mb-4">{t('documents.certifications_title')}</h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('documents.certifications_description')}
            </p>
            
            <div className="space-y-6">
              {/* Equipment Certifications */}
              {certifiedEquipment.map((equipment) => (
                <div key={equipment.key}>
                  <label className="form-label">
                    {t(equipment.labelKey as any)} {t('documents.certification_label')}
                  </label>
                  <div className="mt-2 border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary transition-colors bg-primary/5">
                    <Upload className="mx-auto h-12 w-12 text-primary" />
                    <div className="mt-4">
                      <label htmlFor={`${equipment.key}-cert-upload`} className="cursor-pointer">
                        <span className="btn-primary inline-block">{t('documents.upload_certification')}</span>
                        <input
                          id={`${equipment.key}-cert-upload`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          className="sr-only"
                          onChange={(e) => e.target.files && handleFileUpload(`${equipment.key}-cert`, e.target.files)}
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-sm text-primary">
                      {t('documents.official_certification')} {t(equipment.labelKey as any).split(' - ')[1]}
                    </p>
                  </div>
                  {uploadedFiles[`${equipment.key}-cert`] && renderFileList(`${equipment.key}-cert`, uploadedFiles[`${equipment.key}-cert`])}
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
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          className="sr-only"
                          onChange={(e) => e.target.files && handleFileUpload(`${skill.key}-cert`, e.target.files)}
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-sm text-primary">
                      {t('documents.documentation_for')} {skill.label}
                    </p>
                  </div>
                  {uploadedFiles[`${skill.key}-cert`] && renderFileList(`${skill.key}-cert`, uploadedFiles[`${skill.key}-cert`])}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}