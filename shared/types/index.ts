// Shared types across the application

export interface ApplicationData {
  submissionId: string
  
  // Personal Information
  legalFirstName: string
  middleInitial?: string
  legalLastName: string
  dateOfBirth: string
  socialSecurityNumber: string
  
  // Contact Information
  streetAddress: string
  aptNumber?: string
  city: string
  state: string
  zipCode: string
  phoneNumber: string
  email?: string
  
  // Emergency Contact
  emergencyName?: string
  emergencyPhone?: string
  emergencyRelationship?: string
  
  // Work Authorization
  citizenshipStatus: string
  
  // Employment
  positionApplied?: string
  expectedSalary?: string
  
  // Documents
  documents?: DocumentUpload[]
  
  // Metadata
  language?: string
  ipAddress?: string
  userAgent?: string
  submittedAt: string
}

export interface DocumentUpload {
  type: 'identification' | 'resume' | 'certification'
  name: string
  size: number
  mimeType: string
  data: string // base64
}

export interface SubmissionResult {
  success: boolean
  submissionId: string
  timestamp: string
  message?: string
  error?: string
}