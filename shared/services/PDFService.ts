import { ValidatedApplicationData } from '../validation/schemas'
import { PDFDocument, PDFForm, PDFTextField, rgb } from 'pdf-lib'
import * as fs from 'fs/promises'
import * as path from 'path'
import { pdfFieldMappings, i9FieldMappings, FieldMapping } from '../config/pdfFieldMappings'

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

  async generateApplicationPDF(data: ValidatedApplicationData): Promise<Buffer | { applicationPDF: Buffer; i9PDF: Buffer }> {
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

  private async fillApplicationFields(form: PDFForm, data: ValidatedApplicationData) {
    // Personal Information
    this.setTextFieldWithMapping(form, pdfFieldMappings.personalInfo.legalFirstName, data.legalFirstName)
    this.setTextFieldWithMapping(form, pdfFieldMappings.personalInfo.legalLastName, data.legalLastName)
    
    // Contact Information
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.streetAddress, data.streetAddress)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.city, data.city)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.state, data.state)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.zipCode, data.zipCode)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.homePhone, data.homePhone || data.phoneNumber)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.cellPhone, data.cellPhone || data.phoneNumber)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.socialSecurityNumber, data.socialSecurityNumber)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.email, data.email || '')
    
    // Emergency Contact
    this.setTextFieldWithMapping(form, pdfFieldMappings.emergencyContact.name, data.emergencyName)
    this.setTextFieldWithMapping(form, pdfFieldMappings.emergencyContact.phone, data.emergencyPhone)
    this.setTextFieldWithMapping(form, pdfFieldMappings.emergencyContact.relationship, data.emergencyRelationship)
    
    // Weekly Availability
    this.setTextFieldWithMapping(form, pdfFieldMappings.weeklyAvailability.sunday, data.availabilitySunday)
    this.setTextFieldWithMapping(form, pdfFieldMappings.weeklyAvailability.monday, data.availabilityMonday)
    this.setTextFieldWithMapping(form, pdfFieldMappings.weeklyAvailability.tuesday, data.availabilityTuesday)
    this.setTextFieldWithMapping(form, pdfFieldMappings.weeklyAvailability.wednesday, data.availabilityWednesday)
    this.setTextFieldWithMapping(form, pdfFieldMappings.weeklyAvailability.thursday, data.availabilityThursday)
    this.setTextFieldWithMapping(form, pdfFieldMappings.weeklyAvailability.friday, data.availabilityFriday)
    this.setTextFieldWithMapping(form, pdfFieldMappings.weeklyAvailability.saturday, data.availabilitySaturday)
    
    // Position Information
    this.setTextFieldWithMapping(form, pdfFieldMappings.position.positionApplied, data.positionApplied)
    this.setTextFieldWithMapping(form, pdfFieldMappings.position.jobDiscovery, data.jobDiscovery)
    this.setTextFieldWithMapping(form, pdfFieldMappings.position.expectedSalary, data.expectedSalary)
    
    // Equipment Experience
    this.setTextFieldWithMapping(form, pdfFieldMappings.equipment.sd, this.formatEquipmentExperience(data.equipmentSD))
    this.setTextFieldWithMapping(form, pdfFieldMappings.equipment.su, this.formatEquipmentExperience(data.equipmentSU))
    this.setTextFieldWithMapping(form, pdfFieldMappings.equipment.sur, this.formatEquipmentExperience(data.equipmentSUR))
    this.setTextFieldWithMapping(form, pdfFieldMappings.equipment.cp, this.formatEquipmentExperience(data.equipmentCP))
    this.setTextFieldWithMapping(form, pdfFieldMappings.equipment.cl, this.formatEquipmentExperience(data.equipmentCL))
    this.setTextFieldWithMapping(form, pdfFieldMappings.equipment.rj, this.formatEquipmentExperience(data.equipmentRidingJack))
    
    // Skills and Qualifications
    this.setTextFieldWithMapping(form, pdfFieldMappings.skills.skill1, data.skills1)
    this.setTextFieldWithMapping(form, pdfFieldMappings.skills.skill2, data.skills2)
    this.setTextFieldWithMapping(form, pdfFieldMappings.skills.skill3, data.skills3)
    
    // Education (if present)
    if (data.education && Array.isArray(data.education)) {
      data.education.forEach((edu, index) => {
        if (index === 0) {
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school1Name, edu.schoolName || '')
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school1Year, edu.graduationYear)
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school1Major, edu.fieldOfStudy)
        } else if (index === 1) {
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school2Name, edu.schoolName || '')
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school2Year, edu.graduationYear)
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school2Major, edu.fieldOfStudy)
        }
      })
    }
    
    // Employment History (if present)
    if (data.employment && Array.isArray(data.employment)) {
      data.employment.forEach((emp, index) => {
        if (index === 0) {
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Name, emp.companyName || '')
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1StartPosition, emp.startingPosition)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1EndPosition, emp.endingPosition)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Phone, emp.supervisorPhone)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Supervisor, emp.supervisorName)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Responsibilities, emp.responsibilities)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1ReasonLeaving, emp.reasonForLeaving)
        } else if (index === 1) {
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Name, emp.companyName || '')
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2StartPosition, emp.startingPosition)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2EndPosition, emp.endingPosition)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Phone, emp.supervisorPhone)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Supervisor, emp.supervisorName)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Responsibilities, emp.responsibilities)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2ReasonLeaving, emp.reasonForLeaving)
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

  private setTextFieldWithMapping(form: PDFForm, mapping: FieldMapping, value: string | undefined) {
    if (!value) return

    // Try primary field name first
    try {
      const field = form.getField(mapping.primary) as PDFTextField
      if (field) {
        field.setText(value)
        return
      }
    } catch (error) {
      console.warn(`Primary field "${mapping.primary}" not found:`, error)
    }

    // Try fallback field names
    if (mapping.fallbacks) {
      for (const fallback of mapping.fallbacks) {
        try {
          const field = form.getField(fallback) as PDFTextField
          if (field) {
            field.setText(value)
            console.log(`Used fallback field "${fallback}" for value: ${value}`)
            return
          }
        } catch (error) {
          console.warn(`Fallback field "${fallback}" not found:`, error)
        }
      }
    }

    console.warn(`No working field found for mapping. Primary: "${mapping.primary}", Value: "${value}"`)
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

  private async addI9Form(pdfDoc: PDFDocument, data: ValidatedApplicationData): Promise<Buffer | null> {
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

  private fillI9Fields(form: PDFForm, data: ValidatedApplicationData & any) {
    console.log('Filling I-9 form fields with field mappings...')
    
    // SECTION 1: Employee Information and Attestation
    console.log('Filling Section 1: Employee Information...')
    
    // Primary employee fields using mappings
    this.setTextFieldWithMapping(form, i9FieldMappings.personalInfo.lastName, data.legalLastName)
    this.setTextFieldWithMapping(form, i9FieldMappings.personalInfo.firstName, data.legalFirstName)
    this.setTextFieldWithMapping(form, i9FieldMappings.personalInfo.middleInitial, data.middleInitial || '')
    this.setTextFieldWithMapping(form, i9FieldMappings.personalInfo.otherLastNames, data.otherLastNames || '')
    
    // Address fields using mappings
    this.setTextFieldWithMapping(form, i9FieldMappings.address.streetAddress, data.streetAddress)
    this.setTextFieldWithMapping(form, i9FieldMappings.address.aptNumber, data.aptNumber || '')
    this.setTextFieldWithMapping(form, i9FieldMappings.address.city, data.city)
    this.setDropdownField(form, i9FieldMappings.address.state.primary, data.state)
    this.setTextFieldWithMapping(form, i9FieldMappings.address.zipCode, data.zipCode)
    
    // Identification fields using mappings
    this.setTextFieldWithMapping(form, i9FieldMappings.identification.dateOfBirth, this.formatDateForI9(data.dateOfBirth))
    
    // Handle SSN with length constraint (9 characters max)
    const ssn = data.socialSecurityNumber?.replace(/[^\d]/g, '').substring(0, 9)
    this.setTextFieldWithMapping(form, i9FieldMappings.identification.socialSecurityNumber, ssn)
    
    this.setTextFieldWithMapping(form, i9FieldMappings.identification.phoneNumber, data.phoneNumber)
    this.setTextFieldWithMapping(form, i9FieldMappings.identification.email, data.email || '')
    
    // Handle citizenship status checkboxes
    console.log('Setting citizenship status checkboxes...')
    this.setCitizenshipCheckboxes(form, data.citizenshipStatus)
    
    // Work authorization text fields
    console.log('Filling work authorization text fields...')
    
    if (data.citizenshipStatus === 'permanent_resident' && data.uscisANumber) {
      this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.uscisANumber, data.uscisANumber)
      console.log(`  ✅ Set permanent resident USCIS A-Number: ${data.uscisANumber}`)
    }
    
    // For alien authorized to work
    if (data.citizenshipStatus === 'authorized_alien' || data.citizenshipStatus === 'work_authorized') {
      // Work authorization expiration date
      if (data.workAuthorizationExpiration) {
        this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.expirationDate, this.formatDateForI9(data.workAuthorizationExpiration))
        console.log(`  ✅ Set work authorization expiration: ${data.workAuthorizationExpiration}`)
      }
      
      // Fill ONE of: USCIS A-Number OR I-94 OR Foreign Passport
      console.log('  📋 Filling CB_4 associated fields (choose one):')
      
      if (data.uscisANumber) {
        this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.uscisANumber, data.uscisANumber)
        console.log(`    ✅ Set USCIS A-Number: ${data.uscisANumber}`)
      } else if (data.i94AdmissionNumber) {
        const truncatedI94 = data.i94AdmissionNumber.substring(0, 11)
        this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.i94AdmissionNumber, truncatedI94)
        console.log(`    ✅ Set I-94 Admission Number: ${truncatedI94}`)
      } else if (data.foreignPassportNumber && data.foreignPassportCountry) {
        this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.foreignPassportNumber, 
          `${data.foreignPassportNumber} - ${data.foreignPassportCountry}`)
        console.log(`    ✅ Set Foreign Passport: ${data.foreignPassportNumber} - ${data.foreignPassportCountry}`)
      } else {
        console.warn('    ⚠️ CB_4 checked but no USCIS A-Number, I-94, or Foreign Passport provided')
      }
    }
    
    console.log('✅ Section 1 (Employee Information) completed')
    console.log('📝 Note: Signature fields and Sections 2-3 left blank for HR to complete manually')
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