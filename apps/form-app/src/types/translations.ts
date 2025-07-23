// Type-safe translation system with fallback for dynamic keys
export type TranslationKey = keyof typeof import('../translations').translations.en

// Helper function for type-safe dynamic translation
export function translateKey(t: (key: string) => string, key: string): string {
  // For dynamic keys, we bypass strict typing at runtime
  return t(key)
}

// Type assertion function for cases where we know the key is valid
export function t_safe(t: (key: string) => string, key: string): string {
  return t(key)
}

// Equipment related types
export type EquipmentLabelKey = 
  | 'equipment.sd_label'
  | 'equipment.su_label' 
  | 'equipment.sur_label'
  | 'equipment.cp_label'
  | 'equipment.cl_label'
  | 'equipment.riding_jack_label'

export type EquipmentDescriptionKey =
  | 'equipment.sd_description'
  | 'equipment.su_description'
  | 'equipment.sur_description' 
  | 'equipment.cp_description'
  | 'equipment.cl_description'
  | 'equipment.riding_jack_description'

// Day availability types
export type AvailabilityLabelKey =
  | 'availability.sunday'
  | 'availability.monday'
  | 'availability.tuesday'
  | 'availability.wednesday'
  | 'availability.thursday'
  | 'availability.friday'
  | 'availability.saturday'

// Step title types
export type StepTitleKey =
  | 'steps.personal_info.title'
  | 'steps.contact.title'
  | 'steps.citizenship.title'
  | 'steps.position.title'
  | 'steps.availability.title'
  | 'steps.education_employment.title'
  | 'steps.documents.title'
  | 'steps.review.title'

// Submission result interface
export interface SubmissionResult {
  success: boolean
  submissionId: string
  message?: string
  timestamp: string
}

// Document data interface  
export interface DocumentData {
  type: 'identification' | 'resume' | 'certification'
  name: string
  size: number
  mimeType: string
  data: string
}