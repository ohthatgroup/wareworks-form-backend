import { ValidatedApplicationData } from '../validation/schemas'

interface UploadedFile {
  type: 'identification' | 'resume' | 'certification'
  name: string
  size: number
  mimeType: string
  data: string // base64
}

export class FileUploadService {
  async uploadFiles(files: UploadedFile[]): Promise<{ [key: string]: string }> {
    if (!process.env.ENABLE_FILE_UPLOADS || process.env.ENABLE_FILE_UPLOADS !== 'true') {
      console.log('File uploads disabled, storing as base64')
      return this.storeAsBase64(files)
    }

    try {
      const uploadResults: { [key: string]: string } = {}

      for (const file of files) {
        const uploadResult = await this.uploadToNetlifyBlobs(file)
        uploadResults[file.name] = uploadResult
      }

      return uploadResults

    } catch (error) {
      console.error('File upload error:', error)
      // Fallback to base64 storage if upload fails
      console.log('Falling back to base64 storage')
      return this.storeAsBase64(files)
    }
  }

  private async uploadToNetlifyBlobs(file: UploadedFile): Promise<string> {
    // Convert base64 to buffer
    const buffer = Buffer.from(file.data, 'base64')
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const blobKey = `uploads/${timestamp}_${sanitizedName}`

    try {
      // Use Netlify Blobs API (simplified approach)
      const response = await fetch('/.netlify/functions/upload-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: blobKey,
          data: file.data,
          contentType: file.mimeType,
          category: this.mapDocumentTypeToCategory(file.type)
        })
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`File uploaded successfully: ${file.name} -> ${blobKey}`)
      
      return result.url || blobKey

    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      throw error
    }
  }

  private storeAsBase64(files: UploadedFile[]): { [key: string]: string } {
    const results: { [key: string]: string } = {}
    
    for (const file of files) {
      // Store as data URL for fallback
      results[file.name] = `data:${file.mimeType};base64,${file.data}`
      console.log(`Stored as base64: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
    }
    
    return results
  }

  async validateFile(file: UploadedFile): Promise<{ isValid: boolean, errorKey?: string }> {
    // Basic file validation
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (file.size > maxSize) {
      console.warn(`File too large: ${file.name} (${file.size} bytes)`)
      return { isValid: false, errorKey: 'file_too_large' }
    }

    // Get allowed types based on document type
    const allowedTypes = this.getAllowedMimeTypes(file.type)
    
    if (!allowedTypes.includes(file.mimeType)) {
      console.warn(`Invalid file type: ${file.name} (${file.mimeType}) for type ${file.type}`)
      return { isValid: false, errorKey: this.getValidationErrorKey(file.type) }
    }

    // Additional security check - verify file content matches extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    const expectedMimeTypes = this.getExpectedMimeTypes()

    if (extension && expectedMimeTypes[extension]) {
      if (!expectedMimeTypes[extension].includes(file.mimeType)) {
        console.warn(`File extension/MIME type mismatch: ${file.name}`)
        return { isValid: false, errorKey: 'file_type_mismatch' }
      }
    }

    return { isValid: true }
  }

  async validateAllFiles(files: UploadedFile[]): Promise<{ validFiles: UploadedFile[], errors: Array<{ fileName: string, errorKey: string }> }> {
    const validFiles: UploadedFile[] = []
    const errors: Array<{ fileName: string, errorKey: string }> = []
    
    for (const file of files) {
      const validation = await this.validateFile(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else {
        console.warn(`Skipping invalid file: ${file.name} - ${validation.errorKey}`)
        errors.push({ fileName: file.name, errorKey: validation.errorKey || 'unknown_error' })
      }
    }
    
    return { validFiles, errors }
  }

  // Helper methods for file type validation
  private mapDocumentTypeToCategory(type: 'identification' | 'resume' | 'certification'): string {
    switch (type) {
      case 'identification':
        return 'id'
      case 'resume':
        return 'resume'
      case 'certification':
        return 'certification'
      default:
        return 'id'
    }
  }

  private getAllowedMimeTypes(type: 'identification' | 'resume' | 'certification'): string[] {
    switch (type) {
      case 'identification':
        // ID documents: JPG only (PNG removed per requirement)
        return ['image/jpeg', 'image/jpg']
      case 'resume':
      case 'certification':
        // Resume and certifications: PDF, DOC, DOCX
        return [
          'application/pdf',
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        ]
      default:
        return ['image/jpeg', 'image/jpg']
    }
  }

  private getValidationErrorKey(type: 'identification' | 'resume' | 'certification'): string {
    switch (type) {
      case 'identification':
        return 'id_only_jpg_allowed'
      case 'resume':
        return 'resume_only_docs_allowed'
      case 'certification':
        return 'cert_only_docs_allowed'
      default:
        return 'invalid_file_type'
    }
  }

  private getExpectedMimeTypes(): { [key: string]: string[] } {
    return {
      // Image formats
      'jpg': ['image/jpeg', 'image/jpg'],
      'jpeg': ['image/jpeg', 'image/jpg'],
      // Document formats
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }
  }
}