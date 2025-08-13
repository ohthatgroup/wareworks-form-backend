import { Handler } from '@netlify/functions'

interface UploadRequest {
  key: string
  data: string // base64
  contentType: string
  category?: string // Document category: 'id', 'resume', 'certification'
}

export const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Check if file uploads are enabled
  if (!process.env.ENABLE_FILE_UPLOADS || process.env.ENABLE_FILE_UPLOADS !== 'true') {
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'File uploads disabled',
        url: null 
      })
    }
  }

  try {
    const uploadRequest: UploadRequest = JSON.parse(event.body || '{}')
    
    // Validate required fields
    if (!uploadRequest.key || !uploadRequest.data || !uploadRequest.contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: key, data, contentType' })
      }
    }

    // Basic security validation
    if (uploadRequest.key.includes('..') || uploadRequest.key.includes('//')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid file path' })
      }
    }

    // Validate file type based on document category
    const category = uploadRequest.category || 'id' // Default to 'id' for backwards compatibility
    const allowedMimeTypes = getValidMimeTypes(category)
    
    if (!allowedMimeTypes.includes(uploadRequest.contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: getFileTypeError(category),
          errorKey: 'invalid_file_type',
          message: getFileTypeMessage(category)
        })
      }
    }

    // Convert base64 to buffer
    let buffer = Buffer.from(uploadRequest.data, 'base64')
    let finalContentType = uploadRequest.contentType
    let finalKey = uploadRequest.key
    
    // Smart file size limits based on document type
    let maxSize = 2 * 1024 * 1024 // Default 2MB (ID documents)
    
    if (category === 'resume') {
      maxSize = 1 * 1024 * 1024 // 1MB for resume
    } else if (category && category.includes('-cert')) {
      maxSize = 0.5 * 1024 * 1024 // 500KB for certifications
    }
    
    if (buffer.length > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024 * 10) / 10
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `File too large (max ${sizeMB}MB for ${category || 'this category'})`,
          errorKey: 'file_too_large'
        })
      }
    }

    // Files are now sent as-is, no conversion needed
    console.log(`📄 Processing file as-is: ${finalKey} (${buffer.length} bytes)`)

    // Use Netlify Blobs if available
    if (process.env.NETLIFY_BLOBS_URL) {
      const blobUrl = await uploadToNetlifyBlobs(finalKey, buffer, finalContentType)
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'File uploaded successfully',
          url: blobUrl,
          key: finalKey,
          originalKey: uploadRequest.key
        })
      }
    } else {
      // Fallback: just return success (files will be stored as base64 in form data)
      console.log(`File upload simulated: ${finalKey}`)
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'File processed (stored as base64)',
          url: `data:${finalContentType};base64,${buffer.toString('base64')}`,
          key: finalKey,
          originalKey: uploadRequest.key
        })
      }
    }

  } catch (error) {
    console.error('File upload error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

async function uploadToNetlifyBlobs(key: string, buffer: Buffer, contentType: string): Promise<string> {
  // This would be the actual Netlify Blobs implementation
  // For now, we'll simulate it
  
  const blobsApiUrl = `${process.env.NETLIFY_BLOBS_URL}/api/v1/blobs/${key}`
  
  const response = await fetch(blobsApiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString()
    },
    body: buffer
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Netlify Blobs upload failed: ${response.status} - ${errorText}`)
  }

  // Return the public URL for the uploaded file
  return `${process.env.NETLIFY_BLOBS_URL}/api/v1/blobs/${key}?download=false`
}


// Helper functions for file type validation - IMAGES ONLY
function getValidMimeTypes(category: string): string[] {
  // All document types now accept images only for optimal compression
  return ['image/jpeg', 'image/jpg', 'image/png']
}

function getFileTypeError(category: string): string {
  return 'Only JPEG, JPG, or PNG image files are allowed. Please upload an image of your document.'
}

function getFileTypeMessage(category: string): string {
  if (category === 'id') {
    return 'Upload a clear image of your ID document (photo, screenshot, or scan).'
  } else if (category === 'resume') {
    return 'Upload clear images of your resume (multiple images for multi-page documents).'
  } else {
    return 'Upload a clear image of your certification document. Ensure all text is readable.'
  }
}