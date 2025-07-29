import { z } from 'zod'

const baseSchema = z.object({
  submissionId: z.string(),
  
  // Personal Information - REQUIRED: Name, SSN
  legalFirstName: z.string().min(1, 'First name is required'),
  middleInitial: z.string().optional(),
  legalLastName: z.string().min(1, 'Last name is required'),
  otherLastNames: z.string().optional(),
  dateOfBirth: z.string().optional(),
  socialSecurityNumber: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format'),
  
  // Contact Information - REQUIRED: Address, Phone, Email
  streetAddress: z.string().min(1, 'Street address is required'),
  aptNumber: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  homePhone: z.string().optional(),
  email: z.string().min(1, 'Email is required'),
  
  // Emergency Contact - NOT REQUIRED
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  
  // Work Authorization - NOT REQUIRED
  citizenshipStatus: z.string().optional(),
  workAuthorization: z.string().optional(),
  uscisANumber: z.string().optional(),
  workAuthExpiration: z.string().optional(),
  alienDocumentType: z.string().optional(),
  alienDocumentNumber: z.string().optional(),
  documentCountry: z.string().optional(),
  
  // Basic Eligibility - NOT REQUIRED
  age18: z.string().optional(),
  transportation: z.string().optional(),
  workAuthorizationConfirm: z.string().optional(),
  
  // Position & Experience - NOT REQUIRED
  positionApplied: z.string().optional(),
  expectedSalary: z.string().optional(),
  jobDiscovery: z.string().optional(),
  
  // Equipment Experience
  equipmentSD: z.string().optional(),
  equipmentSU: z.string().optional(),
  equipmentSUR: z.string().optional(),
  equipmentCP: z.string().optional(),
  equipmentCL: z.string().optional(),
  equipmentRidingJack: z.string().optional(),
  
  // Skills
  skills1: z.string().optional(),
  skills2: z.string().optional(),
  skills3: z.string().optional(),
  
  // Work Preferences
  fullTimeEmployment: z.string().optional(),
  swingShifts: z.string().optional(),
  graveyardShifts: z.string().optional(),
  
  // Weekly Availability
  availabilitySunday: z.string().optional(),
  availabilityMonday: z.string().optional(),
  availabilityTuesday: z.string().optional(),
  availabilityWednesday: z.string().optional(),
  availabilityThursday: z.string().optional(),
  availabilityFriday: z.string().optional(),
  availabilitySaturday: z.string().optional(),
  
  // Previous Application
  previouslyApplied: z.string().optional(),
  previousApplicationWhen: z.string().optional(),
  
  // Education History
  education: z.array(z.object({
    schoolName: z.string().optional(),
    graduationYear: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    degreeReceived: z.string().optional()
  })).optional(),
  
  // Employment History
  employment: z.array(z.object({
    companyName: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    startingPosition: z.string().optional(),
    endingPosition: z.string().optional(),
    supervisorName: z.string().optional(),
    supervisorPhone: z.string().optional(),
    responsibilities: z.string().optional(),
    reasonForLeaving: z.string().optional(),
    mayContact: z.string().optional()
  })).optional(),
  
  // Documents
  documents: z.array(z.object({
    type: z.enum(['identification', 'resume', 'certification']),
    name: z.string(),
    size: z.number(),
    mimeType: z.string(),
    data: z.string()
  })).optional(),
  
  // Metadata
  language: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  submittedAt: z.string()
})

export const applicationSchema = baseSchema.refine((data) => {
  // If lawful permanent resident, USCIS A-Number is required
  if (data.citizenshipStatus === 'lawful_permanent') {
    return data.uscisANumber && data.uscisANumber.length > 0
  }
  return true
}, {
  message: "USCIS A-Number is required for lawful permanent residents",
  path: ["uscisANumber"]
}).refine((data) => {
  // If alien authorized to work, additional fields are required
  if (data.citizenshipStatus === 'alien_authorized') {
    return data.workAuthExpiration && 
           data.alienDocumentType && 
           data.alienDocumentNumber && 
           data.documentCountry &&
           data.workAuthExpiration.length > 0 &&
           data.alienDocumentType.length > 0 &&
           data.alienDocumentNumber.length > 0 &&
           data.documentCountry.length > 0
  }
  return true
}, {
  message: "All work authorization fields are required for alien authorized to work",
  path: ["alienDocumentType"]
})

export type ValidatedApplicationData = z.infer<typeof baseSchema>

export function validateApplication(data: unknown) {
  return applicationSchema.safeParse(data)
}