import { ValidatedApplicationData } from '../validation/schemas'
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, rgb, StandardFonts } from 'pdf-lib'
// Import fontkit using require to avoid TypeScript compatibility issues
const fontkit = require('fontkit')
import * as fs from 'fs/promises'
import * as path from 'path'
import { pdfFieldMappings, i9FieldMappings, FieldMapping } from '../config/pdfFieldMappings'

// Field treatment categories based on capacity analysis
interface FieldTreatment {
  category: 'fixed' | 'name' | 'medium' | 'long' | 'continuation'
  minFontSize?: number
  maxFontSize?: number
  allowWrapping?: boolean
}

// Field categorization map - no character limits, just font sizing
const FIELD_TREATMENTS: Record<string, FieldTreatment> = {
  // Category A: Fixed Format Fields - use small fonts to fit any content
  'Applicant SSN - P1': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant SSN - P2': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant SSN - P3': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant DOB - Month': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant DOB - Day': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant DOB - Year': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant State': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant Zip Code': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant Home Phone': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Applicant Cell Phone Number': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Emergency Contact Phone Number': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  
  // Hours fields - use small fonts to fit any content
  'Sunday Hours': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Monday  Hours': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Tuesday  Hours': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Wednesday  Hours': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Thursday  Hours': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Friday  Hours': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Saturday Hours': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  
  // Company date fields
  'Company Date Started 1 - Month': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Started 1 - Day': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Started 1 - Year': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Ended 1 - Month': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Ended 1 - Day': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Ended 1 - Year': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Started 2 - Month': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Started 2 - Day': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Started 2 - Year': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Ended 2 - Month': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Ended 2 - Day': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  'Company Date Ended 2 - Year': { category: 'fixed', minFontSize: 3, maxFontSize: 8 },
  
  // Category B: Names - no limits, just font sizing
  'Applicant Legal First Name': { category: 'name', minFontSize: 3, maxFontSize: 12 },
  'Applicant Legal Last Name': { category: 'name', minFontSize: 3, maxFontSize: 12 },
  'Applicant Middle Initials': { category: 'name', minFontSize: 3, maxFontSize: 12 },
  'Emergency Contact Name': { category: 'name', minFontSize: 3, maxFontSize: 12 },
  'Emergency Contact Relationship': { category: 'name', minFontSize: 3, maxFontSize: 12 },
  'Company Supervisor Name 1': { category: 'name', minFontSize: 3, maxFontSize: 12 },
  'Company Supervisor Name 2': { category: 'name', minFontSize: 3, maxFontSize: 12 },
  
  // Category C: Medium Text - Mobile-optimized with smaller minimum sizes  
  'Position Applied For': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false }, // Reduced min for mobile
  'Expected Salary': { category: 'medium',  minFontSize: 4, maxFontSize: 10, allowWrapping: false }, // Very small field, aggressive min
  'Applicant Street Address': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false }, // Reduced min for mobile
  'Applicant City': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false }, // Reduced min for mobile
  'Applicant Email': { category: 'medium',  minFontSize: 4, maxFontSize: 10, allowWrapping: false }, // Emails can be long, very small min
  'Company Name and Location 1': { category: 'medium',  minFontSize: 4, maxFontSize: 10, allowWrapping: false }, // Can be very long
  'Company Name and Location 2': { category: 'medium',  minFontSize: 4, maxFontSize: 10, allowWrapping: false }, // Can be very long
  'Company Starting Position 1': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false },
  'Company Starting Position 2': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false },
  'Company Ending Position 1': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false },
  'Company Ending Position 2': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false },
  'Company Telephone Number 1': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false }, // (XXX) XXX-XXXX format
  'Company Telephone Number 2': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false },
  'School Name and Location 1': { category: 'medium',  minFontSize: 4, maxFontSize: 10, allowWrapping: false }, // Can be very long
  'School Name and Location 2': { category: 'medium',  minFontSize: 4, maxFontSize: 10, allowWrapping: false }, // Can be very long
  'School Year 1': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false }, // '2018-2022' or 'Graduado en 2022'
  'School Year 2': { category: 'medium',  minFontSize: 5, maxFontSize: 10, allowWrapping: false },
  'School Major 1': { category: 'medium',  minFontSize: 4, maxFontSize: 10, allowWrapping: false }, // Spanish degree names longer
  'School Major 2': { category: 'medium',  minFontSize: 4, maxFontSize: 10, allowWrapping: false },
  
  // Category D: Long Text - Mobile-optimized with smaller minimum sizes and overflow support
  'How did you discover this job opening': { category: 'long',  minFontSize: 5, maxFontSize: 10, allowWrapping: true }, // Reduced min for mobile
  'If yes please specify when and where': { category: 'long',  minFontSize: 4, maxFontSize: 10, allowWrapping: true }, // Very small field, aggressive min
  'Applicable Skills  Qualifications 1': { category: 'long',  minFontSize: 5, maxFontSize: 10, allowWrapping: true }, // Reduced min for mobile
  'Applicable Skills  Qualifications 2': { category: 'long',  minFontSize: 5, maxFontSize: 10, allowWrapping: true }, // Reduced min for mobile
  'Applicable Skills  Qualifications 3': { category: 'long',  minFontSize: 5, maxFontSize: 10, allowWrapping: true }, // Reduced min for mobile
  'Company Responsibilities 1': { category: 'long',  minFontSize: 4, maxFontSize: 10, allowWrapping: true }, // Can be very long, small min
  'Company Responsibilities 2': { category: 'long',  minFontSize: 4, maxFontSize: 10, allowWrapping: true },
  'Company Reason for Leaving 1': { category: 'long',  minFontSize: 4, maxFontSize: 10, allowWrapping: true },
  'Company Reason for Leaving 2': { category: 'long',  minFontSize: 4, maxFontSize: 10, allowWrapping: true },
  
  // Category E: Continuation Fields (auto-populated overflow) - Mobile-optimized
  'How did you discover this job opening - Continued': { category: 'continuation',  minFontSize: 4, maxFontSize: 10 },
  'Company Responsibilities 1 Continued': { category: 'continuation',  minFontSize: 4, maxFontSize: 10 },
  'Company Responsibilities 2 Continued': { category: 'continuation',  minFontSize: 4, maxFontSize: 10 },
  'Company Reason for Leaving 1 Conitnued': { category: 'continuation',  minFontSize: 4, maxFontSize: 10 },
  'Company Reason for Leaving 2 Continued': { category: 'continuation',  minFontSize: 4, maxFontSize: 10 }
}

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

    let pdfDoc: PDFDocument | null = null
    let templateBytes: Buffer | null = null

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
      templateBytes = await fs.readFile(templatePath)
      
      // Load the PDF document
      pdfDoc = await PDFDocument.load(templateBytes)
      
      // Register fontkit for custom fonts
      pdfDoc.registerFontkit(fontkit)
      
      const form = pdfDoc.getForm()
      
      // Fill the application form fields
      await this.fillApplicationFields(form, data)
      
      // Fill the I-9 form fields (now part of the unified template)
      await this.fillI9Fields(form, data)
      
      // Skip merging uploaded documents - they will be sent as separate attachments
      if (data.documents && data.documents.length > 0) {
        console.log(`📄 Skipping merge of ${data.documents.length} uploaded documents (will be sent as separate attachments)`)
      }

      // Add digital signature if provided
      await this.addSignatureToApplicationPDF(pdfDoc, form, data, false)
      
      // Serialize the unified application PDF (includes I-9 form)
      const applicationPdfBytes = await pdfDoc.save()
      const applicationBuffer = Buffer.from(applicationPdfBytes)
      
      // Explicit memory cleanup
      this.cleanupPDFResources(pdfDoc, templateBytes)
      
      console.log('✅ Generated unified PDF with application and I-9 form')
      return applicationBuffer

    } catch (error) {
      console.error('PDF generation error:', error)
      // Cleanup on error as well
      try {
        if (pdfDoc) this.cleanupPDFResources(pdfDoc, templateBytes)
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError)
      }
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateBilingualApplicationPDF(data: ValidatedApplicationData): Promise<{ englishPDF: Buffer; spanishPDF: Buffer }> {
    if (!process.env.ENABLE_PDF_GENERATION || process.env.ENABLE_PDF_GENERATION !== 'true') {
      throw new Error('PDF generation disabled')
    }

    try {
      console.log('Generating bilingual unified PDFs for application:', data.submissionId)
      
      // Generate English PDF
      const englishPDF = await this.generatePDFForLanguage(data, 'english')
      
      // Generate Spanish PDF  
      const spanishPDF = await this.generatePDFForLanguage(data, 'spanish')
      
      console.log('✅ Generated bilingual unified PDFs with I-9 forms included')
      
      // Force garbage collection after processing both PDFs
      this.forceGarbageCollection()
      
      return {
        englishPDF,
        spanishPDF
      }
      
    } catch (error) {
      console.error('Bilingual PDF generation error:', error)
      // Force cleanup on error as well
      this.forceGarbageCollection()
      throw new Error(`Failed to generate bilingual PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async generatePDFForLanguage(data: ValidatedApplicationData, language: 'english' | 'spanish'): Promise<Buffer> {
    let pdfDoc: PDFDocument | null = null
    let templateBytes: Buffer | null = null

    try {
      console.log(`Generating ${language} PDF for application:`, data.submissionId)
      
      // Determine template path based on language
      const baseDir = process.cwd()
      let templatePath: string
      
      const templateName = language === 'spanish' ? 'Wareworks Application - ES.pdf' : 'Wareworks Application.pdf'
      
      // Check if we're in Next.js context (already in apps/form-app)
      if (baseDir.endsWith('form-app') || baseDir.includes('form-app') && !baseDir.endsWith('wareworks-form-backend')) {
        templatePath = path.join(baseDir, 'public', 'templates', templateName)
      } else {
        // We're in root directory context
        templatePath = path.join(baseDir, 'apps', 'form-app', 'public', 'templates', templateName)
      }
      
      console.log(`📁 Loading ${language} template from: ${templatePath}`)
      templateBytes = await fs.readFile(templatePath)
      
      // Load the PDF document
      pdfDoc = await PDFDocument.load(templateBytes)
      
      // Register fontkit for custom fonts
      pdfDoc.registerFontkit(fontkit)
      
      const form = pdfDoc.getForm()
      
      // Fill the application form fields
      await this.fillApplicationFields(form, data)
      
      // Fill the I-9 form fields (now part of the unified template)
      await this.fillI9Fields(form, data)
      
      // Skip merging uploaded documents - they will be sent as separate attachments
      if (data.documents && data.documents.length > 0) {
        console.log(`📄 Skipping merge of ${data.documents.length} uploaded documents for ${language} version (will be sent as separate attachments)`)
      }

      // Add digital signature if provided
      await this.addSignatureToApplicationPDF(pdfDoc, form, data, language === 'spanish')
      
      // Serialize the unified application PDF (includes I-9 form)
      const applicationPdfBytes = await pdfDoc.save()
      const applicationBuffer = Buffer.from(applicationPdfBytes)
      
      // Explicit memory cleanup
      this.cleanupPDFResources(pdfDoc, templateBytes)
      
      console.log(`✅ Generated unified ${language} PDF with application and I-9 form`)
      return applicationBuffer

    } catch (error) {
      console.error(`${language} PDF generation error:`, error)
      // Cleanup on error as well
      try {
        if (pdfDoc) this.cleanupPDFResources(pdfDoc, templateBytes)
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError)
      }
      throw new Error(`Failed to generate ${language} PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    const jobDiscoveryOverflow = this.setTextFieldWithMapping(form, pdfFieldMappings.position.jobDiscovery, data.jobDiscovery)
    // Auto-populate jobDiscoveryContinued with overflow text
    if (jobDiscoveryOverflow) {
      this.setTextFieldWithMapping(form, pdfFieldMappings.position.jobDiscoveryContinued, jobDiscoveryOverflow)
    }
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
          
          const responsibilitiesOverflow = this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1Responsibilities, emp.responsibilities)
          if (responsibilitiesOverflow) {
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1ResponsibilitiesContinued, responsibilitiesOverflow)
          }
          const reasonLeavingOverflow = this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1ReasonLeaving, emp.reasonForLeaving)
          if (reasonLeavingOverflow) {
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company1ReasonLeavingContinued, reasonLeavingOverflow)
          }
          
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
          
          const responsibilities2Overflow = this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2Responsibilities, emp.responsibilities)
          if (responsibilities2Overflow) {
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2ResponsibilitiesContinued, responsibilities2Overflow)
          }
          const reasonLeaving2Overflow = this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2ReasonLeaving, emp.reasonForLeaving)
          if (reasonLeaving2Overflow) {
            this.setTextFieldWithMapping(form, pdfFieldMappings.employment.company2ReasonLeavingContinued, reasonLeaving2Overflow)
          }
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
        // Set mobile-friendly font size
        field.setFontSize(10)
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
        // Get field treatment strategy
        const treatment = FIELD_TREATMENTS[mapping.primary]
        
        if (!treatment) {
          // No treatment defined, use original logic
          field.setText(value)
          field.setFontSize(10)
          return null
        }

        // Calculate optimal font size
        const fontSize = this.calculateOptimalFontSize(value, field, mapping.primary)

        // Handle different treatment categories
        switch (treatment.category) {
          case 'fixed':
            // Fixed format fields: no overflow handling, just set text and font
            field.setText(value) // No character limits - just fit with small font
            field.setFontSize(fontSize)
            return null

          case 'name':
          case 'medium':
            // Names and medium text: dynamic font sizing only
            field.setText(value)
            field.setFontSize(fontSize)
            return null

          case 'long':
            // Long text fields: full treatment with overflow to continuation fields
            // Always set the full text - no limits
            field.setText(value)
            field.setFontSize(fontSize)
            return null // No overflow needed
            
            /*
            // OLD LOGIC - removed character limits
            */

          case 'continuation':
            // Continuation fields: auto-populated from overflow
            field.setText(value)
            field.setFontSize(fontSize)
            return null

          default:
            // Fallback to original behavior
            field.setText(value)
            field.setFontSize(fontSize)
            return null
        }
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
            const estimatedLimit = this.getEstimatedFieldLimit(fallback)
            if (estimatedLimit > 0 && value.length > estimatedLimit) {
              const splitPoint = this.findWordBoundary(value, estimatedLimit)
              const mainText = value.substring(0, splitPoint).trim()
              const overflowText = value.substring(splitPoint).trim()
              
              field.setText(mainText)
              field.setFontSize(10)
              console.log(`Used fallback field "${fallback}" with text split`)
              return overflowText
            } else {
              field.setText(value)
              field.setFontSize(10)
              console.log(`Used fallback field "${fallback}" for value: ${value}`)
              return null
            }
          }
        } catch (error) {
          console.warn(`Fallback field "${fallback}" not found:`, error)
        }
      }
    }

    console.warn(`No working field found for mapping. Primary: "${mapping.primary}", Value: "${value}"`)
    return null
  }

  private findWordBoundary(text: string, maxLength: number): number {
    if (text.length <= maxLength) return text.length
    
    // Find the last space before the max length
    for (let i = maxLength; i >= 0; i--) {
      if (text[i] === ' ' || text[i] === '\n' || text[i] === '\t') {
        return i
      }
    }
    
    // If no word boundary found, split at max length
    return maxLength
  }

  private getEstimatedFieldLimit(fieldName: string): number {
    // Estimated visual limits based on typical PDF field sizes (at 10pt font)
    const fieldLimits: Record<string, number> = {
      // Long text fields that commonly overflow
      'How did you discover this job opening': 21,
      'Company Responsibilities 1': 35,
      'Company Reason for Leaving 1': 33,
      'Company Responsibilities 2': 35,
      'Company Reason for Leaving 2': 33,
      'Applicable Skills  Qualifications 1': 45,
      'Applicable Skills  Qualifications 2': 45,
      'Applicable Skills  Qualifications 3': 45,
      
      // Short fields (names, addresses, etc.) - no limit needed
      'Position Applied For': 25,
      'Expected Salary': 12,
      'Applicant Legal First Name': 15,
      'Applicant Legal Last Name': 15,
      'Company Name and Location 1': 27,
      'Company Name and Location 2': 27,
    }
    
    return fieldLimits[fieldName] || 0 // Return 0 for fields that don't need splitting
  }

  private calculateOptimalFontSize(text: string, field: PDFTextField, fieldName: string): number {
    // Get treatment strategy for this field
    const treatment = FIELD_TREATMENTS[fieldName]
    if (!treatment) {
      // Default to smaller mobile-friendly size
      return 8
    }

    // Get field dimensions
    const fieldRect = field.acroField.getWidgets()[0]?.getRectangle()
    if (!fieldRect) {
      // Fallback to legacy method if we can't get field dimensions
      return this.calculateLegacyFontSize(text, treatment)
    }

    const fieldWidth = fieldRect.width
    const fieldHeight = fieldRect.height
    
    // Calculate based on actual field dimensions and text content
    const minSize = Math.max(treatment.minFontSize || 3, 3) // Absolute minimum 3pt to fit any text
    const maxSize = treatment.maxFontSize || 12
    
    // All fields use dynamic sizing - no character limits, just fit the text
    // Remove the fixed field restriction to allow proper fitting

    // Calculate optimal font size based on text width vs field width
    const finalSize = this.calculateDynamicFontSize(text, fieldWidth, fieldHeight, minSize, maxSize)
    
    // No more mobile adjustments - just fit the text as calculated
    
    console.log(`📏 Font sizing for "${fieldName}": text="${text.substring(0, 20)}..." width=${fieldWidth} → ${finalSize}pt`)
    
    return finalSize
  }

  private calculateDynamicFontSize(text: string, fieldWidth: number, fieldHeight: number, minSize: number, maxSize: number): number {
    // Start with maximum size and reduce until text fits
    for (let fontSize = maxSize; fontSize >= minSize; fontSize -= 0.5) {
      // Estimate text width (rough approximation: 0.6 * fontSize * character count)
      const estimatedTextWidth = text.length * fontSize * 0.6
      
      // Add padding (10% of field width on each side)
      const availableWidth = fieldWidth * 0.8
      
      // Check if text fits with some margin
      if (estimatedTextWidth <= availableWidth) {
        return fontSize
      }
    }
    
    return minSize
  }

  private getMobileAdjustment(textLength: number, category: string): number {
    // Additional reduction for mobile readability
    if (category === 'fixed') {
      return textLength > 8 ? 2 : 1 // Aggressive reduction for fixed fields
    } else if (category === 'name') {
      return textLength > 15 ? 1.5 : 0.5 // Moderate reduction for names
    } else if (category === 'medium') {
      return textLength > 25 ? 2 : 1 // Reduction for medium text
    } else if (category === 'long') {
      return textLength > 40 ? 1 : 0 // Less reduction since these have overflow handling
    }
    
    return 0.5 // Default small reduction
  }

  private calculateLegacyFontSize(text: string, treatment: FieldTreatment): number {
    // Fallback to original logic if field dimensions unavailable
    const minSize = Math.max(treatment.minFontSize || 3, 3) // Allow smaller fonts
    const maxSize = treatment.maxFontSize || 10

    // Use dynamic font sizing based on text length without character limits
    const baseLength = 20 // Baseline for normal-sized text
    if (text.length <= baseLength) {
      return maxSize
    }

    const overflowRatio = text.length / baseLength
    
    if (overflowRatio <= 1.2) {
      return Math.max(maxSize - 1, minSize)
    } else if (overflowRatio <= 1.5) {
      return Math.max(maxSize - 2, minSize)
    } else if (overflowRatio <= 2.0) {
      return Math.max(maxSize - 3, minSize)
    } else {
      return minSize
    }
  }

  private async setSignatureFieldWithMapping(pdfDoc: PDFDocument, form: PDFForm, mapping: FieldMapping, value: string | undefined, isSpanish: boolean = false) {
    if (!value) return

    // Load High Empathy handwriting font first
    const handwritingFont = await this.loadHighEmpathyFont(pdfDoc)

    // Try to find the signature field to get its position
    let signatureField: PDFTextField | null = null
    let fieldName = ''

    // Try primary field name first
    try {
      signatureField = form.getField(mapping.primary) as PDFTextField
      fieldName = mapping.primary
    } catch (error) {
      // Try fallback field names
      if (mapping.fallbacks) {
        for (const fallback of mapping.fallbacks) {
          try {
            signatureField = form.getField(fallback) as PDFTextField
            fieldName = fallback
            break
          } catch (error) {
            // Continue trying other fallbacks
          }
        }
      }
    }

    if (!signatureField) {
      console.warn(`No working signature field found for mapping. Primary: "${mapping.primary}", Value: "${value}"`)
      return
    }

    try {
      const pages = pdfDoc.getPages()
      
      // Target page 4 (index 3, since arrays are 0-based) where signature field is located
      const targetPage = pages[3]
      
      if (!targetPage) {
        console.warn('Page 4 not found in PDF')
        return
      }
      
      // Clear the original form field (make it transparent/empty)
      signatureField.setText('')
      
      // Use appropriate coordinates based on template
      const signatureX = isSpanish ? 138.948 : 162.328
      const signatureY = isSpanish ? 55.9305 : 82.0697
      const fieldWidth = 150
      const fieldHeight = 22
      
      // Calculate appropriate font size based on field height
      const fontSize = Math.min(fieldHeight * 0.7, 20) // 70% of field height, max 20pt
      
      // Adjust Y position to center vertically in the field (PDF coordinates are bottom-left origin)
      const adjustedY = signatureY + (fieldHeight - fontSize) / 2
      
      targetPage.drawText(value, {
        x: signatureX + 3, // Small left padding
        y: adjustedY,
        size: fontSize,
        font: handwritingFont,
        color: rgb(0, 0, 0), // Black color
      })

      console.log(`🖊️ Signature drawn on Page 4 signature field with High Empathy handwriting font: ${value}`)
      console.log(`📍 Field position: x=${signatureX}, y=${signatureY}, size=${fieldWidth}x${fieldHeight}`)
      console.log(`📍 Text position: x=${signatureX + 3}, y=${adjustedY}, fontSize=${fontSize}`)
      
    } catch (error) {
      console.warn('Could not draw signature on page, falling back to form field:', error)
      // Fallback: just set the form field text normally
      signatureField.setText(value)
    }
  }

  private async loadHighEmpathyFont(pdfDoc: PDFDocument) {
    try {
      // Handle path resolution for both standalone and Next.js contexts
      const baseDir = process.cwd()
      let fontPath: string
      
      // Check if we're in Next.js context (already in apps/form-app)
      if (baseDir.endsWith('form-app') || baseDir.includes('form-app') && !baseDir.endsWith('wareworks-form-backend')) {
        fontPath = path.join(baseDir, 'public', 'fonts', 'High Empathy.otf')
      } else {
        // We're in root directory context
        fontPath = path.join(baseDir, 'apps', 'form-app', 'public', 'fonts', 'High Empathy.otf')
      }
      
      console.log(`📝 Loading High Empathy font from: ${fontPath}`)
      const fontBytes = await fs.readFile(fontPath)
      const font = await pdfDoc.embedFont(fontBytes)
      console.log('✅ High Empathy font loaded successfully')
      return font
      
    } catch (error) {
      console.warn('⚠️ Could not load High Empathy font, falling back to standard font:', error)
      // Fallback to a standard font if custom font fails
      return await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
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
    
    // If no citizenship status provided, leave all unchecked
    if (!citizenshipStatus || citizenshipStatus.trim() === '') {
      console.log('No citizenship status provided - leaving all checkboxes unchecked')
      return
    }
    
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
        console.warn(`Unknown or empty citizenship status: ${citizenshipStatus}`)
        // Leave all checkboxes unchecked if status is unclear or empty
        console.log('No citizenship status selected - leaving all checkboxes unchecked')
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

  private formatDateForI9(dateString: string | undefined): string {
    // Return empty string if no date provided
    if (!dateString || dateString.trim() === '') {
      return ''
    }
    
    try {
      const date = new Date(dateString)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string provided to formatDateForI9: "${dateString}"`)
        return ''
      }
      
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      })
    } catch (error) {
      console.warn(`Error formatting date for I-9: "${dateString}"`, error)
      return ''
    }
  }

  // Handle signature in WareWorks Application PDF
  private async addSignatureToApplicationPDF(pdfDoc: PDFDocument, form: PDFForm, data: ValidatedApplicationData, isSpanish: boolean = false) {
    if (!data.signature) {
      console.log('📝 No signature provided, skipping signature field')
      return
    }

    console.log('🖊️ Processing digital signature for application PDF')

    try {
      // Fill signature text field with the person's name using handwriting font
      await this.setSignatureFieldWithMapping(pdfDoc, form, pdfFieldMappings.signature.signature, data.signature, isSpanish)
      console.log(`🖊️ Signature filled with handwriting font: ${data.signature}`)

      // Fill signature date fields
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

  /**
   * Explicit memory cleanup for PDF resources
   * Helps prevent memory leaks in serverless environments
   */
  private cleanupPDFResources(pdfDoc: PDFDocument | null, templateBytes: Buffer | null) {
    try {
      if (pdfDoc) {
        // Clear any cached resources from the PDF document
        // Note: pdf-lib doesn't expose direct cleanup methods, but we can clear references
        (pdfDoc as any)._context = null
        
        // Clear form references if they exist
        if ((pdfDoc as any)._form) {
          (pdfDoc as any)._form = null
        }
      }

      // Clear template bytes reference
      if (templateBytes) {
        templateBytes = null as any
      }

      console.log('🧹 PDF resources cleaned up')
    } catch (error) {
      console.warn('Warning during PDF resource cleanup:', error)
    }
  }

  /**
   * Force garbage collection hint
   * Helps free memory in Node.js serverless environments
   */
  private forceGarbageCollection() {
    try {
      // Log memory usage before cleanup
      const before = process.memoryUsage()
      
      // Force garbage collection if available (requires --expose-gc flag)
      if (global.gc) {
        global.gc()
        console.log('🗑️ Forced garbage collection executed')
        
        // Log memory usage after cleanup
        const after = process.memoryUsage()
        const heapReduction = before.heapUsed - after.heapUsed
        if (heapReduction > 0) {
          console.log(`📉 Memory freed: ${Math.round(heapReduction / 1024 / 1024 * 100) / 100}MB`)
        }
      } else {
        // Fallback: encourage GC through null assignments
        console.log('🧹 Memory cleanup hint (gc not available)')
      }
    } catch (error) {
      console.warn('Warning during garbage collection:', error)
    }
  }
}