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
          contentType: file.mimeType
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

  async validateFile(file: UploadedFile): Promise<boolean> {
    // Basic file validation
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (file.size > maxSize) {
      console.warn(`File too large: ${file.name} (${file.size} bytes)`)
      return false
    }

    if (!allowedTypes.includes(file.mimeType)) {
      console.warn(`Invalid file type: ${file.name} (${file.mimeType})`)
      return false
    }

    // Additional security check - verify file content matches extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    const expectedMimeTypes: { [key: string]: string[] } = {
      'pdf': ['application/pdf'],
      'jpg': ['image/jpeg', 'image/jpg'],
      'jpeg': ['image/jpeg', 'image/jpg'],
      'png': ['image/png'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }

    if (extension && expectedMimeTypes[extension]) {
      if (!expectedMimeTypes[extension].includes(file.mimeType)) {
        console.warn(`File extension/MIME type mismatch: ${file.name}`)
        return false
      }
    }

    return true
  }

  async validateAllFiles(files: UploadedFile[]): Promise<UploadedFile[]> {
    const validFiles: UploadedFile[] = []
    
    for (const file of files) {
      const isValid = await this.validateFile(file)
      if (isValid) {
        validFiles.push(file)
      } else {
        console.warn(`Skipping invalid file: ${file.name}`)
      }
    }
    
    return validFiles
  }
}