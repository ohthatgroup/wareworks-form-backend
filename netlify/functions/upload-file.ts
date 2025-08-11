import { Handler } from '@netlify/functions'

interface UploadRequest {
  key: string
  data: string // base64
  contentType: string
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

    // Validate file type - only allow images
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedMimeTypes.includes(uploadRequest.contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Only image files are allowed',
          errorKey: 'only_images_allowed',
          message: 'Please take a screenshot of your document and upload the image file instead.'
        })
      }
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(uploadRequest.data, 'base64')
    
    // File size limit (10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'File too large (max 10MB)' })
      }
    }

    // Use Netlify Blobs if available
    if (process.env.NETLIFY_BLOBS_URL) {
      const blobUrl = await uploadToNetlifyBlobs(uploadRequest.key, buffer, uploadRequest.contentType)
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'File uploaded successfully',
          url: blobUrl,
          key: uploadRequest.key
        })
      }
    } else {
      // Fallback: just return success (files will be stored as base64 in form data)
      console.log(`File upload simulated: ${uploadRequest.key}`)
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'File processed (stored as base64)',
          url: `data:${uploadRequest.contentType};base64,${uploadRequest.data}`,
          key: uploadRequest.key
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