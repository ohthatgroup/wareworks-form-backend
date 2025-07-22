import { ApplicationData } from '../types'
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

  async generateApplicationPDF(data: ApplicationData): Promise<Buffer | { applicationPDF: Buffer; i9PDF: Buffer }> {
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
      
      // Merge uploaded documents if any
      if (data.documents && data.documents.length > 0) {
        await this.mergeUploadedDocuments(pdfDoc, data.documents)
      }
      
      // Generate separate I-9 form if needed
      let i9Buffer: Buffer | null = null
      if (this.hasI9Documents(data)) {
        i9Buffer = await this.addI9Form(pdfDoc, data)
      }
      
      // Serialize the main application PDF
      const applicationPdfBytes = await pdfDoc.save()
      const applicationBuffer = Buffer.from(applicationPdfBytes)
      
      // Return both PDFs if I-9 is needed
      if (i9Buffer) {
        return {
          applicationPDF: applicationBuffer,
          i9PDF: i9Buffer
        }
      } else {
        return applicationBuffer
      }

    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async fillApplicationFields(form: PDFForm, data: ApplicationData) {
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

  private setCheckboxField(form: PDFForm, fieldName: string, checked: boolean) {
    try {
      const field = form.getField(fieldName)
      if (field && 'check' in field) {
        if (checked) {
          (field as any).check()
          console.log(`  ✅ Checked "${fieldName}"`)
        } else {
          (field as any).uncheck()
        }
      }
    } catch (error) {
      console.warn(`Could not set checkbox "${fieldName}":`, error)
    }
  }

  private setDropdownField(form: PDFForm, fieldName: string, value: string | undefined) {
    if (!value) return
    
    try {
      const field = form.getField(fieldName)
      if (field && 'select' in field) {
        (field as any).select(value)
        console.log(`  🔽 Set dropdown "${fieldName}" = "${value}"`)
      }
    } catch (error) {
      console.warn(`Could not set dropdown "${fieldName}":`, error)
    }
  }

  private setCitizenshipCheckboxes(form: PDFForm, citizenshipStatus: string) {
    console.log(`Setting citizenship status: ${citizenshipStatus}`)
    
    // Reset all citizenship checkboxes first
    this.setCheckboxField(form, 'CB_1', false) // US Citizen
    this.setCheckboxField(form, 'CB_2', false) // Non-citizen national
    this.setCheckboxField(form, 'CB_3', false) // Lawful permanent resident  
    this.setCheckboxField(form, 'CB_4', false) // Alien authorized to work
    
    // Set the appropriate checkbox based on status
    switch (citizenshipStatus) {
      case 'citizen':
        this.setCheckboxField(form, 'CB_1', true) // US Citizen
        break
      case 'non_citizen_national':
        this.setCheckboxField(form, 'CB_2', true) // Non-citizen national
        break
      case 'permanent_resident':
        this.setCheckboxField(form, 'CB_3', true) // Lawful permanent resident
        break
      case 'authorized_alien':
      case 'work_authorized':
        this.setCheckboxField(form, 'CB_4', true) // Alien authorized to work
        break
      default:
        console.warn(`Unknown citizenship status: ${citizenshipStatus}`)
        // Default to authorized alien if status is unclear
        this.setCheckboxField(form, 'CB_4', true)
        break
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

  private hasI9Documents(data: ApplicationData): boolean {
    return !!(data.citizenshipStatus && data.citizenshipStatus !== 'citizen')
  }

  private async addI9Form(pdfDoc: PDFDocument, data: ApplicationData): Promise<Buffer | null> {
    try {
      console.log('Creating separate filled I-9 form for non-citizen applicant...')
      const i9TemplatePath = path.join(process.cwd(), 'Templates', 'i-9.pdf')
      const i9TemplateBytes = await fs.readFile(i9TemplatePath)
      const i9Doc = await PDFDocument.load(i9TemplateBytes)
      
      // Fill the I-9 form fields
      console.log('Filling I-9 form fields...')
      const i9Form = i9Doc.getForm()
      this.fillI9Fields(i9Form, data)
      
      // CRITICAL FIX: Instead of merging into main PDF (which loses form fields),
      // return the filled I-9 as a separate PDF buffer
      console.log('Saving filled I-9 form as separate PDF...')
      const filledI9Bytes = await i9Doc.save()
      
      console.log('✅ I-9 form filled successfully with Section 1 data')
      console.log('📝 Note: I-9 form returned as separate PDF to preserve form fields')
      
      return Buffer.from(filledI9Bytes)
      
    } catch (error) {
      console.warn('Could not create I-9 form:', error)
      return null
    }
  }

  private fillI9Fields(form: PDFForm, data: ApplicationData & any) {
    console.log('Filling I-9 form fields with CORRECT field names...')
    
    // SECTION 1: Employee Information and Attestation
    console.log('Filling Section 1: Employee Information...')
    
    // Primary employee fields (using CORRECT field names from template analysis)
    this.setTextField(form, 'Last Name (Family Name)', data.legalLastName)
    this.setTextField(form, 'First Name Given Name', data.legalFirstName)
    this.setTextField(form, 'Employee Middle Initial (if any)', data.middleInitial || '')
    this.setTextField(form, 'Employee Other Last Names Used (if any)', data.otherLastNames || '')
    
    // Address fields  
    this.setTextField(form, 'Address Street Number and Name', data.streetAddress)
    this.setTextField(form, 'Apt Number (if any)', data.aptNumber || '')
    this.setTextField(form, 'City or Town', data.city)
    
    // State field (this is a dropdown!)
    this.setDropdownField(form, 'State', data.state)
    
    this.setTextField(form, 'ZIP Code', data.zipCode)
    this.setTextField(form, 'Date of Birth mmddyyyy', this.formatDateForI9(data.dateOfBirth))
    
    // Handle SSN with length constraint (9 characters max)
    const ssn = data.socialSecurityNumber?.replace(/[^\d]/g, '').substring(0, 9)
    this.setTextField(form, 'US Social Security Number', ssn)
    
    this.setTextField(form, 'Telephone Number', data.phoneNumber)
    this.setTextField(form, 'Employees E-mail Address', data.email || '')
    
    // Additional Section 1 duplicate fields
    this.setTextField(form, 'Last Name Family Name from Section 1', data.legalLastName)
    this.setTextField(form, 'First Name Given Name from Section 1', data.legalFirstName) 
    this.setTextField(form, 'Middle initial if any from Section 1', data.middleInitial || '')
    
    // Handle citizenship status checkboxes (Section 1)
    console.log('Setting citizenship status checkboxes...')
    this.setCitizenshipCheckboxes(form, data.citizenshipStatus)
    
    // CRITICAL: Work authorization text fields (the ones you mentioned!)
    console.log('Filling work authorization text fields...')
    
    if (data.citizenshipStatus === 'permanent_resident' && data.uscisANumber) {
      // Fill the permanent resident text field
      this.setTextField(form, '3 A lawful permanent resident Enter USCIS or ANumber', data.uscisANumber)
      console.log(`  ✅ Set permanent resident field with USCIS A-Number: ${data.uscisANumber}`)
      
      // Also fill the separate USCIS A-Number field
      this.setTextField(form, 'USCIS ANumber', data.uscisANumber)
    }
    
    // For alien authorized to work (CB_4), fill the expiration date AND one of the required fields
    if (data.citizenshipStatus === 'authorized_alien' || data.citizenshipStatus === 'work_authorized') {
      // Always fill the expiration date for alien authorized
      if (data.workAuthorizationExpiration) {
        this.setTextField(form, 'Exp Date mmddyyyy', this.formatDateForI9(data.workAuthorizationExpiration))
        console.log(`  ✅ Set work authorization expiration: ${data.workAuthorizationExpiration}`)
      }
      
      // For CB_4, must fill ONE of: USCIS A-Number OR I-94 OR Foreign Passport
      console.log('  📋 Filling CB_4 associated fields (choose one):')
      
      // Priority 1: USCIS A-Number (if available for alien authorized)
      if (data.uscisANumber) {
        this.setTextField(form, 'USCIS ANumber', data.uscisANumber)
        console.log(`    ✅ Set USCIS A-Number: ${data.uscisANumber}`)
      }
      // Priority 2: Form I-94 Admission Number
      else if (data.i94AdmissionNumber) {
        const truncatedI94 = data.i94AdmissionNumber.substring(0, 11)
        this.setTextField(form, 'Form I94 Admission Number', truncatedI94)
        console.log(`    ✅ Set I-94 Admission Number: ${truncatedI94}`)
      }
      // Priority 3: Foreign Passport Number and Country
      else if (data.foreignPassportNumber && data.foreignPassportCountry) {
        this.setTextField(form, 'Foreign Passport Number and Country of IssuanceRow1', 
          `${data.foreignPassportNumber} - ${data.foreignPassportCountry}`)
        console.log(`    ✅ Set Foreign Passport: ${data.foreignPassportNumber} - ${data.foreignPassportCountry}`)
      } else {
        console.warn('    ⚠️ CB_4 checked but no USCIS A-Number, I-94, or Foreign Passport provided')
      }
    }
    
    // Note: I-94 and Foreign Passport are now handled above in the CB_4 logic
    
    console.log('✅ Section 1 (Employee Information) completed')
    console.log('📝 Note: Signature fields and Sections 2-3 left blank for HR to complete manually')
    
    console.log('I-9 form fields filled successfully')
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