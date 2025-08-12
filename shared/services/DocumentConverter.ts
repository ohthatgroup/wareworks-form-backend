import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

const execAsync = promisify(exec)

interface ConversionResult {
  success: boolean
  pdfBuffer?: Buffer
  error?: string
}

export class DocumentConverter {
  private tempDir: string

  constructor() {
    this.tempDir = os.tmpdir()
  }

  async convertToPdf(fileBuffer: Buffer, originalFilename: string): Promise<ConversionResult> {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const tempPrefix = `wareworks_${timestamp}_${randomId}`
    
    // Determine file extension
    const extension = path.extname(originalFilename).toLowerCase()
    if (!['.doc', '.docx'].includes(extension)) {
      return {
        success: false,
        error: 'Unsupported file type. Only DOC and DOCX files are supported.'
      }
    }

    const inputFile = path.join(this.tempDir, `${tempPrefix}${extension}`)
    const outputFile = path.join(this.tempDir, `${tempPrefix}.pdf`)

    try {
      // Write input file
      await fs.writeFile(inputFile, fileBuffer)
      console.log(`📄 Temp file created: ${inputFile}`)

      // Check if LibreOffice is available and find the correct path
      let libreOfficePath = process.env.LIBREOFFICE_PATH || 'libreoffice'
      try {
        await execAsync(`${libreOfficePath} --version`)
      } catch (error) {
        console.error('LibreOffice not found at default path:', error)
        console.log('Attempting alternative paths...')
        
        // Try common alternative paths
        const altPaths = [
          '/usr/bin/libreoffice',
          '/opt/libreoffice/program/soffice',
          '/usr/local/bin/libreoffice'
        ]
        
        let libreOfficeFound = false
        for (const altPath of altPaths) {
          try {
            await execAsync(`${altPath} --version`)
            console.log(`Found LibreOffice at: ${altPath}`)
            libreOfficePath = altPath
            libreOfficeFound = true
            break
          } catch (altError) {
            continue
          }
        }
        
        if (!libreOfficeFound) {
          return {
            success: false,
            error: 'Document conversion service unavailable. Please save your document as PDF and try again.'
          }
        }
      }

      // Convert using LibreOffice headless
      const command = `${libreOfficePath} --headless --convert-to pdf --outdir "${this.tempDir}" "${inputFile}"`
      console.log(`🔄 Converting document: ${command}`)
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        cwd: this.tempDir
      })

      console.log('LibreOffice stdout:', stdout)
      if (stderr) {
        console.warn('LibreOffice stderr:', stderr)
      }

      // Check if output file was created
      try {
        await fs.access(outputFile)
      } catch (error) {
        console.error('PDF output file not found:', outputFile)
        return {
          success: false,
          error: 'Document conversion failed. Please ensure your document is not corrupted and try again.'
        }
      }

      // Read the converted PDF
      const pdfBuffer = await fs.readFile(outputFile)
      console.log(`✅ Conversion successful: ${pdfBuffer.length} bytes`)

      return {
        success: true,
        pdfBuffer
      }

    } catch (error) {
      console.error('Document conversion error:', error)
      
      // Provide user-friendly error messages
      let userMessage = 'Document conversion failed. Please save your document as PDF and try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          userMessage = 'Document conversion timed out. Please try a smaller file or save as PDF.'
        } else if (error.message.includes('ENOENT')) {
          userMessage = 'Document conversion service unavailable. Please save your document as PDF and try again.'
        }
      }

      return {
        success: false,
        error: userMessage
      }

    } finally {
      // Clean up temporary files
      try {
        await fs.unlink(inputFile).catch(() => {}) // Ignore cleanup errors
        await fs.unlink(outputFile).catch(() => {}) // Ignore cleanup errors
        console.log(`🧹 Cleaned up temp files: ${tempPrefix}`)
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError)
      }
    }
  }

  // Helper method to check if LibreOffice is available
  async isLibreOfficeAvailable(): Promise<boolean> {
    try {
      await execAsync('libreoffice --version')
      return true
    } catch (error) {
      return false
    }
  }

  // Helper method to get supported file types
  getSupportedExtensions(): string[] {
    return ['.doc', '.docx']
  }

  // Helper method to check if file needs conversion
  needsConversion(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase()
    return this.getSupportedExtensions().includes(extension)
  }
}