import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ValidatedApplicationData } from '@/shared/validation/schemas'
import { Upload, X, Eye, Download } from 'lucide-react'
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

  const handleFileUpload = async (category: string, files: FileList) => {
    const fileArray = Array.from(files)
    
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
          {documentsByCategory['resume'] && renderDocumentList('resume', documentsByCategory['resume'])}
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
                    {translateKey(t, equipment.labelKey)} {t('documents.certification_label')}
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
                      {t('documents.official_certification')} {translateKey(t, equipment.labelKey).split(' - ')[1]}
                    </p>
                  </div>
                  {documentsByCategory[`${equipment.key}-cert`] && renderDocumentList(`${equipment.key}-cert`, documentsByCategory[`${equipment.key}-cert`])}
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