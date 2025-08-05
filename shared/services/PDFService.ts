import { ValidatedApplicationData } from '../validation/schemas'
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, rgb } from 'pdf-lib'
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
      console.log('✅ Template analysis loaded successfully')
    } catch (error) {
      // This is expected if the analysis file doesn't exist - it's optional
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
      // Handle path resolution for both standalone and Next.js contexts
      const baseDir = process.cwd()
      let templatePath: string
      
      // Check if we're in Next.js context (already in apps/form-app)
      if (baseDir.endsWith('form-app') || baseDir.includes('form-app') && !baseDir.endsWith('wareworks-form-backend')) {
        templatePath = path.join(baseDir, 'public', 'templates', 'Wareworks Application.pdf')
      } else {
        // We're in root directory context
        templatePath = path.join(baseDir, 'apps', 'form-app', 'public', 'templates', 'Wareworks Application.pdf')
      }
      
      console.log(`📁 Loading template from: ${templatePath}`)
      const templateBytes = await fs.readFile(templatePath)
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(templateBytes)
      const form = pdfDoc.getForm()
      
      // Fill the form fields based on template analysis
      await this.fillApplicationFields(form, data)
      
      // Merge uploaded documents if any
      if (data.documents && data.documents.length > 0) {
        console.log(`📎 Merging ${data.documents.length} uploaded documents...`)
        await this.mergeUploadedDocuments(pdfDoc, data.documents)
        console.log('✅ Document merging completed')
      } else {
        console.log('📄 No uploaded documents to merge')
      }

      // Add digital signature if provided
      await this.addSignatureToApplicationPDF(pdfDoc, form, data)
      
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
    this.setTextFieldWithMapping(form, pdfFieldMappings.personalInfo.middleInitial, data.middleInitial)
    
    // Split Date of Birth fields
    if (data.dateOfBirth) {
      const dobParts = this.splitDate(data.dateOfBirth)
      this.setTextFieldWithMapping(form, pdfFieldMappings.personalInfo.dobMonth, dobParts.month)
      this.setTextFieldWithMapping(form, pdfFieldMappings.personalInfo.dobDay, dobParts.day)
      this.setTextFieldWithMapping(form, pdfFieldMappings.personalInfo.dobYear, dobParts.year)
    }
    
    // Contact Information
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.streetAddress, data.streetAddress)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.city, data.city)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.state, data.state)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.zipCode, data.zipCode)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.homePhone, data.homePhone || data.phoneNumber)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.cellPhone, data.homePhone || data.phoneNumber)
    this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.email, data.email || '')
    
    // Split SSN fields
    if (data.socialSecurityNumber) {
      const ssnParts = this.splitSSN(data.socialSecurityNumber)
      this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.ssnPart1, ssnParts.part1)
      this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.ssnPart2, ssnParts.part2)
      this.setTextFieldWithMapping(form, pdfFieldMappings.contactInfo.ssnPart3, ssnParts.part3)
    }
    
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
    this.setTextFieldWithMapping(form, pdfFieldMappings.position.jobDiscoveryContinued, data.jobDiscoveryContinued)
    this.setTextFieldWithMapping(form, pdfFieldMappings.position.expectedSalary, data.expectedSalary)
    
    // Checkbox Questions
    this.fillCheckboxQuestions(form, data)
    
    // Forklift Certification (checkboxes)
    this.setCheckboxFieldWithMapping(form, pdfFieldMappings.forklift.sd, data.forkliftSD || false)
    this.setCheckboxFieldWithMapping(form, pdfFieldMappings.forklift.su, data.forkliftSU || false)
    this.setCheckboxFieldWithMapping(form, pdfFieldMappings.forklift.sur, data.forkliftSUR || false)
    this.setCheckboxFieldWithMapping(form, pdfFieldMappings.forklift.cp, data.forkliftCP || false)
    this.setCheckboxFieldWithMapping(form, pdfFieldMappings.forklift.cl, data.forkliftCL || false)
    this.setCheckboxFieldWithMapping(form, pdfFieldMappings.forklift.rj, data.forkliftRidingJack || false)
    
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
          // Diploma checkboxes
          this.setCheckboxFieldWithMapping(form, pdfFieldMappings.education.school1DiplomaYes, edu.degreeReceived === 'yes')
          this.setCheckboxFieldWithMapping(form, pdfFieldMappings.education.school1DiplomaNo, edu.degreeReceived === 'no')
        } else if (index === 1) {
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school2Name, edu.schoolName || '')
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school2Year, edu.graduationYear)
          this.setTextFieldWithMapping(form, pdfFieldMappings.education.school2Major, edu.fieldOfStudy)
          // Diploma checkboxes
          this.setCheckboxFieldWithMapping(form, pdfFieldMappings.education.school2DiplomaYes, edu.degreeReceived === 'yes')
          this.setCheckboxFieldWithMapping(form, pdfFieldMappings.education.school2DiplomaNo, edu.degreeReceived === 'no')
        }
      })
    }
    
    // Employment History (if present)
    if (data.employment && Array.isArray(data.employment)) {
      data.employment.forEach((emp, index) => {
        if (index === 0) {
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Name, emp.companyName || '')
          
          // Split employment start date
          if (emp.startDate) {
            const startParts = this.splitDate(emp.startDate)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1StartMonth, startParts.month)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1StartDay, startParts.day)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1StartYear, startParts.year)
          }
          
          // Split employment end date
          if (emp.endDate) {
            const endParts = this.splitDate(emp.endDate)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1EndMonth, endParts.month)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1EndDay, endParts.day)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1EndYear, endParts.year)
          }
          
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1StartPosition, emp.startingPosition)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1EndPosition, emp.endingPosition)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Phone, emp.supervisorPhone)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Supervisor, emp.supervisorName)
          
          // May contact checkboxes
          this.setCheckboxFieldWithMapping(form, pdfFieldMappings.employment.company1MayContactYes, emp.mayContact === 'yes')
          this.setCheckboxFieldWithMapping(form, pdfFieldMappings.employment.company1MayContactNo, emp.mayContact === 'no')
          
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Responsibilities, emp.responsibilities)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1ResponsibilitiesContinued, emp.responsibilitiesContinued)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1ReasonLeaving, emp.reasonForLeaving)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1ReasonLeavingContinued, emp.reasonLeavingContinued)
          
        } else if (index === 1) {
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Name, emp.companyName || '')
          
          // Split employment start date
          if (emp.startDate) {
            const startParts = this.splitDate(emp.startDate)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2StartMonth, startParts.month)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2StartDay, startParts.day)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2StartYear, startParts.year)
          }
          
          // Split employment end date
          if (emp.endDate) {
            const endParts = this.splitDate(emp.endDate)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2EndMonth, endParts.month)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2EndDay, endParts.day)
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2EndYear, endParts.year)
          }
          
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2StartPosition, emp.startingPosition)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2EndPosition, emp.endingPosition)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Phone, emp.supervisorPhone)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Supervisor, emp.supervisorName)
          
          // May contact checkboxes
          this.setCheckboxFieldWithMapping(form, pdfFieldMappings.employment.company2MayContactYes, emp.mayContact === 'yes')
          this.setCheckboxFieldWithMapping(form, pdfFieldMappings.employment.company2MayContactNo, emp.mayContact === 'no')
          
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Responsibilities, emp.responsibilities)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2ResponsibilitiesContinued, emp.responsibilitiesContinued)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2ReasonLeaving, emp.reasonForLeaving)
          this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2ReasonLeavingContinued, emp.reasonLeavingContinued)
        }
      })
    }
    
    // Signature Date (current date split into components)
    const currentDate = new Date()
    const sigDateParts = this.splitDate(currentDate.toISOString())
    this.setTextFieldWithMapping(form, pdfFieldMappings.signature.signatureDateMonth, sigDateParts.month)
    this.setTextFieldWithMapping(form, pdfFieldMappings.signature.signatureDateDay, sigDateParts.day)
    this.setTextFieldWithMapping(form, pdfFieldMappings.signature.signatureDateYear, sigDateParts.year)
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
      case 'us_citizen':
        this.setCheckboxField(form, 'CB_1', true) // US Citizen
        break
      case 'noncitizen_national':
        this.setCheckboxField(form, 'CB_2', true) // Non-citizen national
        break
      case 'lawful_permanent':
      case 'permanent_resident': // Handle both formats
        this.setCheckboxField(form, 'CB_3', true) // Lawful permanent resident
        break
      case 'alien_authorized':
        this.setCheckboxField(form, 'CB_4', true) // Alien authorized to work
        break
      default:
        console.warn(`Unknown citizenship status: ${citizenshipStatus}`)
        // Default to authorized alien if status is unclear
        this.setCheckboxField(form, 'CB_4', true)
        break
    }
  }



  private setCheckboxFieldWithMapping(form: PDFForm, mapping: FieldMapping, checked: boolean) {
    if (!checked) return // Only check boxes that should be checked

    try {
      const field = form.getField(mapping.primary) as PDFCheckBox
      field.check()
    } catch (error) {
      // If primary field doesn't work, just silently ignore
      console.log(`Checkbox field "${mapping.primary}" not found, skipping`)
    }
  }

  private splitDate(dateString: string): { month: string, day: string, year: string } {
    try {
      const date = new Date(dateString)
      return {
        month: String(date.getMonth() + 1).padStart(2, '0'), // JavaScript months are 0-indexed
        day: String(date.getDate()).padStart(2, '0'),
        year: String(date.getFullYear())
      }
    } catch (error) {
      console.warn('Error splitting date:', dateString, error)
      return { month: '', day: '', year: '' }
    }
  }

  private splitSSN(ssn: string): { part1: string, part2: string, part3: string } {
    // Remove all non-digit characters
    const cleanSSN = ssn.replace(/\D/g, '')
    
    if (cleanSSN.length !== 9) {
      console.warn('Invalid SSN length:', cleanSSN.length)
      return { part1: '', part2: '', part3: '' }
    }
    
    return {
      part1: cleanSSN.substring(0, 3),  // First 3 digits
      part2: cleanSSN.substring(3, 5),  // Middle 2 digits  
      part3: cleanSSN.substring(5, 9)   // Last 4 digits
    }
  }

  private fillCheckboxQuestions(form: PDFForm, data: ValidatedApplicationData) {
    // Simple checkbox handling - just check the yes/no based on data
    
    // Age verification
    if (data.age18 === 'yes') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.ageOver18Yes, true)
    } else if (data.age18 === 'no') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.ageOver18No, true)
    }
    
    // Transportation
    if (data.transportation === 'yes') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.reliableTransportYes, true)
    } else if (data.transportation === 'no') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.reliableTransportNo, true)
    }
    
    // Work authorization
    if (data.workAuthorizationConfirm === 'yes') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.workAuthorizedYes, true)
    } else if (data.workAuthorizationConfirm === 'no') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.workAuthorizedNo, true)
    }
    
    // Full-time employment
    if (data.fullTimeEmployment === 'yes') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.fullTimeYes, true)
    } else if (data.fullTimeEmployment === 'no') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.fullTimeNo, true)
    }
    
    // Swing shifts
    if (data.swingShifts === 'yes') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.swingShiftsYes, true)
    } else if (data.swingShifts === 'no') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.swingShiftsNo, true)
    }
    
    // Graveyard shifts
    if (data.graveyardShifts === 'yes') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.graveyardShiftsYes, true)
    } else if (data.graveyardShifts === 'no') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.graveyardShiftsNo, true)
    }
    
    // Previously applied
    if (data.previouslyApplied === 'yes') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.previouslyAppliedYes, true)
    } else if (data.previouslyApplied === 'no') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.previouslyAppliedNo, true)
    }
    
    // Forklift certification
    if (data.forkliftCertification === 'yes') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.forkliftCertYes, true)
    } else if (data.forkliftCertification === 'no') {
      this.setCheckboxFieldWithMapping(form, pdfFieldMappings.checkboxFields.forkliftCertNo, true)
    }
  }

  private hasI9Documents(data: ValidatedApplicationData): boolean {
    // HR needs I-9 form for every application packet regardless of citizenship status
    return true
  }

  private async addI9Form(pdfDoc: PDFDocument, data: ValidatedApplicationData): Promise<Buffer | null> {
    try {
      console.log('Creating separate filled I-9 form for application packet...')
      
      // Handle path resolution for both standalone and Next.js contexts
      const baseDir = process.cwd()
      let i9TemplatePath: string
      
      // Check if we're in Next.js context (already in apps/form-app)
      if (baseDir.endsWith('form-app') || baseDir.includes('form-app') && !baseDir.endsWith('wareworks-form-backend')) {
        i9TemplatePath = path.join(baseDir, 'public', 'templates', 'i-9.pdf')
      } else {
        // We're in root directory context
        i9TemplatePath = path.join(baseDir, 'apps', 'form-app', 'public', 'templates', 'i-9.pdf')
      }
      
      console.log(`📁 Loading I-9 template from: ${i9TemplatePath}`)
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
    
    if ((data.citizenshipStatus === 'lawful_permanent' || data.citizenshipStatus === 'permanent_resident') && data.uscisANumber) {
      // Use CB_3 specific field for permanent residents
      this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.uscisANumberCB3, data.uscisANumber)
      console.log(`  ✅ Set permanent resident USCIS A-Number (CB_3 field): ${data.uscisANumber}`)
    }
    
    // For alien authorized to work
    if (data.citizenshipStatus === 'alien_authorized') {
      // Work authorization expiration date
      if (data.workAuthExpiration) {
        this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.expirationDate, this.formatDateForI9(data.workAuthExpiration))
        console.log(`  ✅ Set work authorization expiration: ${data.workAuthExpiration}`)
      }
      
      // Fill the appropriate field based on document type
      console.log('  📋 Filling CB_4 associated fields based on document type:')
      
      if (data.alienDocumentType === 'uscis_a_number' && data.alienDocumentNumber) {
        // Use CB_4 specific field for authorized aliens with USCIS A-Number
        this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.uscisANumberCB4, data.alienDocumentNumber)
        console.log(`    ✅ Set USCIS A-Number (CB_4 field): ${data.alienDocumentNumber}`)
      } else if (data.alienDocumentType === 'form_i94' && data.i94AdmissionNumber) {
        const truncatedI94 = data.i94AdmissionNumber.substring(0, 11)
        this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.i94AdmissionNumber, truncatedI94)
        console.log(`    ✅ Set I-94 Admission Number: ${truncatedI94}`)
      } else if (data.alienDocumentType === 'foreign_passport' && data.foreignPassportNumber && data.foreignPassportCountry) {
        this.setTextFieldWithMapping(form, i9FieldMappings.workAuthorization.foreignPassportNumber, 
          `${data.foreignPassportNumber} - ${data.foreignPassportCountry}`)
        console.log(`    ✅ Set Foreign Passport: ${data.foreignPassportNumber} - ${data.foreignPassportCountry}`)
      } else {
        console.warn(`    ⚠️ CB_4 checked but missing required fields for document type: ${data.alienDocumentType}`)
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
        console.log(`📋 Processing document: ${doc.name} (${doc.mimeType}, ${doc.size} bytes)`)
        
        if (doc.mimeType === 'application/pdf') {
          console.log('  📄 Merging PDF document...')
          // Convert base64 to buffer
          const docBuffer = Buffer.from(doc.data, 'base64')
          console.log(`  📦 Decoded buffer size: ${docBuffer.length} bytes`)
          
          const uploadedDoc = await PDFDocument.load(docBuffer)
          const pageCount = uploadedDoc.getPageCount()
          console.log(`  📑 PDF has ${pageCount} pages`)
          
          // Add a title page before the PDF content
          await this.addDocumentTitlePage(pdfDoc, doc)
          console.log(`  📋 Added title page for "${doc.name}"`)
          
          // Copy pages from uploaded document
          const pages = await pdfDoc.copyPages(uploadedDoc, uploadedDoc.getPageIndices())
          pages.forEach((page) => pdfDoc.addPage(page))
          console.log(`  ✅ Added ${pages.length} pages to main document`)
          
        } else if (doc.mimeType.startsWith('image/')) {
          console.log('  🖼️ Embedding image document...')
          // Add title page first
          await this.addDocumentTitlePage(pdfDoc, doc)
          console.log(`  📋 Added title page for "${doc.name}"`)
          // Then add the image
          await this.addImageToDocument(pdfDoc, doc)
          console.log('  ✅ Image embedded on new page')
          
        } else {
          console.warn(`  ⚠️ Unsupported document type: ${doc.mimeType}`)
        }
      } catch (error) {
        console.warn(`❌ Could not merge document ${doc.name}:`, error)
      }
    }
    
    const finalPageCount = pdfDoc.getPageCount()
    console.log(`📊 Final document has ${finalPageCount} total pages`)
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
      
    } catch (error) {
      console.warn(`Could not add image ${doc.name}:`, error)
    }
  }

  private async addDocumentTitlePage(pdfDoc: PDFDocument, doc: any) {
    try {
      const page = pdfDoc.addPage()
      const { width, height } = page.getSize()
      
      // Get document category title
      const categoryTitle = this.getDocumentCategoryTitle(doc)
      
      // Draw border
      page.drawRectangle({
        x: 50,
        y: 50,
        width: width - 100,
        height: height - 100,
        borderColor: rgb(0.2, 0.2, 0.2),
        borderWidth: 2
      })
      
      // Draw title
      page.drawText(categoryTitle, {
        x: 80,
        y: height - 120,
        size: 24,
        color: rgb(0.1, 0.1, 0.4) // Dark blue
      })
      
      // Draw filename
      page.drawText(`File: ${doc.name}`, {
        x: 80,
        y: height - 160,
        size: 14,
        color: rgb(0, 0, 0)
      })
      
      // Draw file info
      const fileSize = (doc.size / 1024).toFixed(1) + ' KB'
      page.drawText(`Size: ${fileSize}`, {
        x: 80,
        y: height - 180,
        size: 12,
        color: rgb(0.3, 0.3, 0.3)
      })
      
      // Draw separator line
      page.drawLine({
        start: { x: 80, y: height - 200 },
        end: { x: width - 80, y: height - 200 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7)
      })
      
      // Add note about document content
      page.drawText('Document content follows on next page(s)', {
        x: 80,
        y: height - 230,
        size: 10,
        color: rgb(0.5, 0.5, 0.5)
      })
      
    } catch (error) {
      console.warn(`Could not add title page for ${doc.name}:`, error)
    }
  }

  private getDocumentCategoryTitle(doc: any): string {
    const category = doc.category || (doc.type === 'identification' ? 'id' : doc.type === 'resume' ? 'resume' : 'certification')
    
    switch (category) {
      case 'id':
        return 'Government Identification Document'
      case 'resume':
        return 'Resume / CV'
      case 'forkliftSD-cert':
        return 'SD - Sit Down Forklift Certification'
      case 'forkliftSU-cert':
        return 'SU - Stand Up Forklift Certification'
      case 'forkliftSUR-cert':
        return 'SUR - Stand Up Reach Certification'
      case 'forkliftCP-cert':
        return 'CP - Cherry Picker Certification'
      case 'forkliftCL-cert':
        return 'CL - Clamps Certification'
      case 'forkliftRidingJack-cert':
        return 'Riding Jack Certification'
      case 'skills1-cert':
      case 'skills2-cert':
      case 'skills3-cert':
        return 'Skills Certification Document'
      default:
        return 'Uploaded Document'
    }
  }

  // Handle signature in WareWorks Application PDF
  private async addSignatureToApplicationPDF(pdfDoc: PDFDocument, form: PDFForm, data: ValidatedApplicationData) {
    if (!data.signature) {
      console.log('📝 No signature provided, skipping signature field')
      return
    }

    console.log('🖊️ Processing digital signature for application PDF')

    try {
      // The "Signature" field in the PDF is a PDFSignature field (for digital certificates)
      // Since we have text-based signatures, we'll draw the text directly onto the PDF
      const pages = pdfDoc.getPages()
      const lastPage = pages[pages.length - 1] // Signature typically on last page
      
      // Draw signature text at approximate signature field location
      // These coordinates are estimated and may need adjustment based on your PDF template
      lastPage.drawText(data.signature, {
        x: 100, // X coordinate - adjust as needed
        y: 150, // Y coordinate - adjust as needed  
        size: 14,
        color: rgb(0, 0, 0), // Black text
        // You could add a cursive font here if available
      })
      
      console.log(`🖊️ Signature drawn on PDF: ${data.signature}`)

      // Fill signature date fields (these are text fields and work correctly)
      if (data.signatureDate) {
        const signatureDate = new Date(data.signatureDate)
        
        this.setTextFieldWithMapping(form, pdfFieldMappings.signature.signatureDateMonth, 
          (signatureDate.getMonth() + 1).toString().padStart(2, '0'))
        this.setTextFieldWithMapping(form, pdfFieldMappings.signature.signatureDateDay, 
          signatureDate.getDate().toString().padStart(2, '0'))
        this.setTextFieldWithMapping(form, pdfFieldMappings.signature.signatureDateYear, 
          signatureDate.getFullYear().toString())
          
        console.log(`📅 Signature date filled: ${signatureDate.toLocaleDateString()}`)
      }

    } catch (error) {
      console.error('❌ Failed to process signature:', error)
      // Continue without signature rather than failing entire PDF generation
    }
  }
}