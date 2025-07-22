import { ValidatedApplicationData } from '../types'
import { PDFDocument, PDFForm, PDFTextField, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

export class PDFService {
  private templateAnalysis: any

  constructor() {
    this.loadTemplateAnalysis()
  }

  private async loadTemplateAnalysis() {
    try {
      const analysisPath = path.join(process.cwd(), 'Archive', 'template-analysis.json')
      const analysisData = await fs.readFile(analysisPath, 'utf-8')
      this.templateAnalysis = JSON.parse(analysisData)
    } catch (error) {
      console.warn('Could not load template analysis:', error)
      this.templateAnalysis = null
    }
  }

  async generateApplicationPDF(data: ValidatedApplicationData): Promise<Buffer> {
    if (!process.env.ENABLE_PDF_GENERATION || process.env.ENABLE_PDF_GENERATION !== 'true') {
      throw new Error('PDF generation disabled')
    }

    try {
      console.log('Generating PDF for application:', data.submissionId)
      
      // Load the Wareworks Application PDF template
      const templatePath = path.join(process.cwd(), 'Templates', 'Wareworks Application.pdf')
      const templateBytes = await fs.readFile(templatePath)
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(templateBytes)
      const form = pdfDoc.getForm()
      
      // Fill the form fields based on template analysis
      await this.fillApplicationFields(form, data)
      
      // If I-9 documents are provided, merge the I-9 form as well
      if (this.hasI9Documents(data)) {
        await this.addI9Form(pdfDoc, data)
      }
      
      // Merge uploaded documents if any
      if (data.documents && data.documents.length > 0) {
        await this.mergeUploadedDocuments(pdfDoc, data.documents)
      }
      
      // Serialize the PDF
      const pdfBytes = await pdfDoc.save()
      return Buffer.from(pdfBytes)

    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async fillApplicationFields(form: PDFForm, data: ValidatedApplicationData) {
    // Personal Information
    this.setTextField(form, 'Legal First Name', data.legalFirstName)
    this.setTextField(form, 'Legal Last Name', data.legalLastName)
    
    // Contact Information
    this.setTextField(form, 'Street Address', data.streetAddress)
    this.setTextField(form, 'City', data.city)
    this.setTextField(form, 'State', data.state)
    this.setTextField(form, 'Zip Code', data.zipCode)
    this.setTextField(form, 'Home Phone', data.homePhone || data.phoneNumber)
    this.setTextField(form, 'Cell Phone Number', data.cellPhone || data.phoneNumber)
    this.setTextField(form, 'Social Security Number', data.socialSecurityNumber)
    this.setTextField(form, 'Email', data.email || '')
    
    // Emergency Contact
    this.setTextField(form, 'Name', data.emergencyName)
    this.setTextField(form, 'Number', data.emergencyPhone)
    this.setTextField(form, 'Relationship', data.emergencyRelationship)
    
    // Weekly Availability (if present in data)
    if (data.weeklyAvailability) {
      this.setTextField(form, 'Sunday', this.formatAvailability(data.weeklyAvailability.sunday))
      this.setTextField(form, 'Monday', this.formatAvailability(data.weeklyAvailability.monday))
      this.setTextField(form, 'Tuesday', this.formatAvailability(data.weeklyAvailability.tuesday))
      this.setTextField(form, 'Wednesday', this.formatAvailability(data.weeklyAvailability.wednesday))
      this.setTextField(form, 'Thursday', this.formatAvailability(data.weeklyAvailability.thursday))
      this.setTextField(form, 'Friday', this.formatAvailability(data.weeklyAvailability.friday))
      this.setTextField(form, 'Saturday', this.formatAvailability(data.weeklyAvailability.saturday))
    }
    
    // Position Information
    this.setTextField(form, 'Position Applied For', data.positionApplied)
    this.setTextField(form, 'How did you discover this job opening', data.jobDiscovery)
    this.setTextField(form, 'Expected Salary', data.expectedSalary)
    
    // Equipment Experience
    this.setTextField(form, 'SD Sit Down', this.formatEquipmentExperience(data.equipmentSD))
    this.setTextField(form, 'SU Stand Up', this.formatEquipmentExperience(data.equipmentSU))
    this.setTextField(form, 'SUR Stand Up Reach', this.formatEquipmentExperience(data.equipmentSUR))
    this.setTextField(form, 'CP Cherry Picker', this.formatEquipmentExperience(data.equipmentCP))
    this.setTextField(form, 'CL Clamps', this.formatEquipmentExperience(data.equipmentCL))
    this.setTextField(form, 'Riding Jack', this.formatEquipmentExperience(data.equipmentRJ))
    
    // Skills and Qualifications
    if (data.skillsQualifications && Array.isArray(data.skillsQualifications)) {
      data.skillsQualifications.forEach((skill, index) => {
        if (index < 3) { // Template has 3 skill fields
          this.setTextField(form, `Applicable Skills  Qualifications ${index + 1}`, skill.skill)
        }
      })
    }
    
    // Education (if present)
    if (data.education && Array.isArray(data.education)) {
      data.education.forEach((edu, index) => {
        if (index < 2) { // Template has 2 education sections
          const suffix = index === 0 ? '' : '_2'
          this.setTextField(form, `School Name and Location${suffix}`, `${edu.schoolName} - ${edu.location}`)
          this.setTextField(form, `Year${suffix}`, edu.graduationYear)
          this.setTextField(form, `Major${suffix}`, edu.degree)
        }
      })
    }
    
    // Employment History (if present)
    if (data.employmentHistory && Array.isArray(data.employmentHistory)) {
      data.employmentHistory.forEach((emp, index) => {
        if (index < 2) { // Template has 2 employment sections
          const suffix = index === 0 ? '' : '_2'
          this.setTextField(form, `Company Name and Location${suffix}`, `${emp.companyName} - ${emp.location}`)
          this.setTextField(form, `Starting Position${suffix}`, emp.startingPosition)
          this.setTextField(form, `Ending Position${suffix}`, emp.endingPosition)
          this.setTextField(form, `Telephone Number${suffix}`, emp.phoneNumber)
          this.setTextField(form, `Supervisor Name${suffix}`, emp.supervisorName)
          this.setTextField(form, `Responsibilities 1${suffix}`, emp.responsibilities)
          this.setTextField(form, `Reason for Leaving 1${suffix}`, emp.reasonForLeaving)
        }
      })
    }
  }

  private setTextField(form: PDFForm, fieldName: string, value: string | undefined) {
    if (!value) return
    
    try {
      const field = form.getField(fieldName) as PDFTextField
      if (field) {
        field.setText(value)
      }
    } catch (error) {
      console.warn(`Could not set field "${fieldName}":`, error)
    }
  }

  private formatAvailability(availability: any): string {
    if (!availability || !availability.available) return ''
    return availability.time || 'Available'
  }

  private formatEquipmentExperience(experience: string | undefined): string {
    if (!experience) return ''
    // Convert experience level to readable format
    const mapping: { [key: string]: string } = {
      'none': 'None',
      'basic': 'Basic',
      'intermediate': 'Intermediate', 
      'advanced': 'Advanced',
      'expert': 'Expert'
    }
    return mapping[experience] || experience
  }

  private hasI9Documents(data: ValidatedApplicationData): boolean {
    return !!(data.citizenshipStatus && data.citizenshipStatus !== 'citizen')
  }

  private async addI9Form(pdfDoc: PDFDocument, data: ValidatedApplicationData) {
    try {
      const i9TemplatePath = path.join(process.cwd(), 'Templates', 'i-9.pdf')
      const i9TemplateBytes = await fs.readFile(i9TemplatePath)
      const i9Doc = await PDFDocument.load(i9TemplateBytes)
      
      // Fill I-9 specific fields
      const i9Form = i9Doc.getForm()
      this.fillI9Fields(i9Form, data)
      
      // Copy I-9 pages to main document
      const i9Pages = await pdfDoc.copyPages(i9Doc, i9Doc.getPageIndices())
      i9Pages.forEach((page) => pdfDoc.addPage(page))
      
    } catch (error) {
      console.warn('Could not add I-9 form:', error)
    }
  }

  private fillI9Fields(form: PDFForm, data: ValidatedApplicationData) {
    // Fill I-9 form fields based on the template analysis
    this.setTextField(form, 'Last Name (Family Name)', data.legalLastName)
    this.setTextField(form, 'First Name Given Name', data.legalFirstName)
    this.setTextField(form, 'Employee Middle Initial (if any)', data.middleInitial || '')
    this.setTextField(form, 'Employee Other Last Names Used (if any)', data.otherLastNames || '')
    this.setTextField(form, 'Address Street Number and Name', data.streetAddress)
    this.setTextField(form, 'Apt Number (if any)', data.aptNumber || '')
    this.setTextField(form, 'City or Town', data.city)
    this.setTextField(form, 'ZIP Code', data.zipCode)
    this.setTextField(form, 'Date of Birth mmddyyyy', this.formatDateForI9(data.dateOfBirth))
    this.setTextField(form, 'US Social Security Number', data.socialSecurityNumber)
    this.setTextField(form, 'Telephone Number', data.phoneNumber)
    this.setTextField(form, 'Employees E-mail Address', data.email || '')
    
    // Work authorization fields
    if (data.uscisANumber) {
      this.setTextField(form, 'USCIS ANumber', data.uscisANumber)
    }
    
    // Current date for signature
    const today = new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\//g, '')
    this.setTextField(form, "Today's Date mmddyyy", today)
  }

  private formatDateForI9(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      }).replace(/\//g, '')
    } catch {
      return dateString
    }
  }

  private async mergeUploadedDocuments(pdfDoc: PDFDocument, documents: any[]) {
    for (const doc of documents) {
      try {
        if (doc.mimeType === 'application/pdf') {
          // Convert base64 to buffer
          const docBuffer = Buffer.from(doc.data, 'base64')
          const uploadedDoc = await PDFDocument.load(docBuffer)
          
          // Copy pages from uploaded document
          const pages = await pdfDoc.copyPages(uploadedDoc, uploadedDoc.getPageIndices())
          pages.forEach((page) => pdfDoc.addPage(page))
        } else if (doc.mimeType.startsWith('image/')) {
          // Handle image documents by embedding them in a new page
          await this.addImageToDocument(pdfDoc, doc)
        }
      } catch (error) {
        console.warn(`Could not merge document ${doc.name}:`, error)
      }
    }
  }

  private async addImageToDocument(pdfDoc: PDFDocument, doc: any) {
    try {
      const page = pdfDoc.addPage()
      const { width, height } = page.getSize()
      
      const imageBuffer = Buffer.from(doc.data, 'base64')
      let image
      
      if (doc.mimeType === 'image/jpeg' || doc.mimeType === 'image/jpg') {
        image = await pdfDoc.embedJpg(imageBuffer)
      } else if (doc.mimeType === 'image/png') {
        image = await pdfDoc.embedPng(imageBuffer)
      } else {
        return // Unsupported image type
      }
      
      // Scale image to fit page
      const imageAspectRatio = image.width / image.height
      const pageAspectRatio = width / height
      
      let imageWidth, imageHeight
      if (imageAspectRatio > pageAspectRatio) {
        imageWidth = width - 100 // 50px margin on each side
        imageHeight = imageWidth / imageAspectRatio
      } else {
        imageHeight = height - 100 // 50px margin on top and bottom
        imageWidth = imageHeight * imageAspectRatio
      }
      
      // Center the image on the page
      const x = (width - imageWidth) / 2
      const y = (height - imageHeight) / 2
      
      page.drawImage(image, { x, y, width: imageWidth, height: imageHeight })
      
      // Add document title
      page.drawText(`Document: ${doc.name}`, {
        x: 50,
        y: height - 30,
        size: 12,
        color: rgb(0, 0, 0)
      })
      
    } catch (error) {
      console.warn(`Could not add image ${doc.name}:`, error)
    }
  }
}