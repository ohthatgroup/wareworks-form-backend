import { z } from 'zod'

/**
 * Complete rebuild of application schema based on actual UI requirements
 * Only fields with red asterisks in UI are marked as required
 * All other fields are optional with conditional validation via refine
 * Updated: submissionId and submittedAt are optional (server-generated)
 */

// US States enum for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const

// Validation patterns
const SSN_REGEX = /^\d{3}-\d{2}-\d{4}$/
const PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/
const ZIP_REGEX = /^\d{5}(-\d{4})?$/

const baseSchema = z.object({
  submissionId: z.string().optional(),
  
  // REQUIRED FIELDS (have red asterisks in UI)
  legalFirstName: z.string().min(1, 'First name is required'),
  legalLastName: z.string().min(1, 'Last name is required'),
  socialSecurityNumber: z.string().regex(SSN_REGEX, 'Invalid SSN format (use XXX-XX-XXXX)'),
  streetAddress: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.enum(US_STATES, { errorMap: () => ({ message: 'Please select a valid state' }) }),
  zipCode: z.string().regex(ZIP_REGEX, 'Invalid ZIP code (use 12345 or 12345-6789)'),
  phoneNumber: z.string().regex(PHONE_REGEX, 'Invalid phone number (use (XXX) XXX-XXXX format)'),
  
  // ALL OTHER FIELDS ARE OPTIONAL
  
  // Personal Information - Optional
  middleInitial: z.string().max(1, 'Middle initial must be a single character').optional(),
  otherLastNames: z.string().optional(),
  dateOfBirth: z.string().optional(),
  
  // Contact Information - Optional
  aptNumber: z.string().optional(),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  homePhone: z.string().regex(PHONE_REGEX, 'Invalid phone number').or(z.literal('')).optional(),
  
  // Emergency Contact - Optional
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().regex(PHONE_REGEX, 'Invalid phone number').or(z.literal('')).optional(),
  emergencyRelationship: z.string().optional(),
  
  // Work Authorization - Optional (validated conditionally)
  citizenshipStatus: z.enum(['us_citizen', 'noncitizen_national', 'lawful_permanent', 'alien_authorized']).or(z.literal('')).optional(),
  uscisANumber: z.string().optional(),
  workAuthExpiration: z.string().or(z.literal('')).optional(),
  workAuthorizationExpiration: z.string().or(z.literal('')).optional(),
  alienDocumentType: z.enum(['uscis_a_number', 'form_i94', 'foreign_passport']).or(z.literal('')).optional(),
  alienDocumentNumber: z.string().optional(),
  
  // Separate fields for alien authorized document types
  i94AdmissionNumber: z.string().optional(),
  foreignPassportNumber: z.string().optional(),
  foreignPassportCountry: z.string().optional(),
  
  // Basic Eligibility - Optional
  age18: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  transportation: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  workAuthorizationConfirm: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  reliableTransport: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  workAuthorized: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  forkliftCertification: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  
  // Position & Experience - Optional
  positionApplied: z.string().optional(),
  expectedSalary: z.string().optional(),
  jobDiscovery: z.string().optional(),
  jobDiscoveryContinued: z.string().optional(),
  
  // Equipment Experience - Optional
  equipmentSD: z.string().optional(),
  equipmentSU: z.string().optional(),
  equipmentSUR: z.string().optional(),
  equipmentCP: z.string().optional(),
  equipmentCL: z.string().optional(),
  equipmentRidingJack: z.string().optional(),
  
  // Skills - Optional
  skills1: z.string().optional(),
  skills2: z.string().optional(),
  skills3: z.string().optional(),
  
  // Skills Certification Status - Optional
  skills1Certified: z.boolean().optional(),
  skills2Certified: z.boolean().optional(),
  skills3Certified: z.boolean().optional(),
  
  // Work Preferences - Optional
  fullTimeEmployment: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  swingShifts: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  graveyardShifts: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  
  // Weekly Availability - Optional
  availabilitySunday: z.string().optional(),
  availabilityMonday: z.string().optional(),
  availabilityTuesday: z.string().optional(),
  availabilityWednesday: z.string().optional(),
  availabilityThursday: z.string().optional(),
  availabilityFriday: z.string().optional(),
  availabilitySaturday: z.string().optional(),
  
  // Previous Application - Optional
  previouslyApplied: z.enum(['yes', 'no']).or(z.literal('')).optional(),
  previousApplicationWhen: z.string().optional(),
  
  // Education History - Optional
  education: z.array(z.object({
    schoolName: z.string().optional(),
    graduationYear: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    degreeReceived: z.string().optional()
  })).optional(),
  
  // Employment History - Optional
  employment: z.array(z.object({
    companyName: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    startingPosition: z.string().optional(),
    endingPosition: z.string().optional(),
    supervisorName: z.string().optional(),
    supervisorPhone: z.string().regex(PHONE_REGEX, 'Invalid phone number').or(z.literal('')).optional(),
    responsibilities: z.string().optional(),
    responsibilitiesContinued: z.string().optional(),
    reasonForLeaving: z.string().optional(),
    reasonLeavingContinued: z.string().optional(),
    mayContact: z.enum(['yes', 'no']).or(z.literal('')).optional()
  })).optional(),
  
  // Documents - Optional
  documents: z.array(z.object({
    type: z.enum(['identification', 'resume', 'certification']),
    category: z.string(), // Upload category: 'id', 'resume', 'equipmentSD-cert', 'skills1-cert', etc.
    name: z.string(),
    size: z.number(),
    mimeType: z.string(),
    data: z.string()
  })).optional(),
  
  // Metadata
  language: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  submittedAt: z.string().optional()
})

// Use base schema without complex conditional refines to avoid stale validation errors
// Conditional validation is now handled dynamically in the form logic
export const applicationSchema = baseSchema

export type ValidatedApplicationData = z.infer<typeof baseSchema>

export function validateApplication(data: unknown) {
  return applicationSchema.safeParse(data)
}