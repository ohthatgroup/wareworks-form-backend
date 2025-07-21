'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationSchema, type ValidatedApplicationData } from '../shared/validation/schemas'
import { useIframeHeight } from '../hooks/useIframeHeight'
import { FormStep } from '../components/FormStep'
import { ProgressBar } from '../components/ProgressBar'
import { FormNavigation } from '../components/FormNavigation'
import { PersonalInfoStep } from '../components/steps/PersonalInfoStep'
import { ContactInfoStep } from '../components/steps/ContactInfoStep'
import { CitizenshipStep } from '../components/steps/CitizenshipStep'
import { PositionStep } from '../components/steps/PositionStep'
import { AvailabilityStep } from '../components/steps/AvailabilityStep'
import { EducationEmploymentStep } from '../components/steps/EducationEmploymentStep'
import { DocumentsStep } from '../components/steps/DocumentsStep'
import { ReviewStep } from '../components/steps/ReviewStep'
import { SuccessStep } from '../components/steps/SuccessStep'
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext'
import { LanguageSelector } from '../components/ui/LanguageSelector'

const STEPS = [
  { id: 'personal', titleKey: 'steps.personal_info.title', component: PersonalInfoStep },
  { id: 'contact', titleKey: 'steps.contact.title', component: ContactInfoStep },
  { id: 'citizenship', titleKey: 'steps.citizenship.title', component: CitizenshipStep },
  { id: 'position', titleKey: 'steps.position.title', component: PositionStep },
  { id: 'availability', titleKey: 'steps.availability.title', component: AvailabilityStep },
  { id: 'education', titleKey: 'steps.education_employment.title', component: EducationEmploymentStep },
  { id: 'documents', titleKey: 'steps.documents.title', component: DocumentsStep },
  { id: 'review', titleKey: 'steps.review.title', component: ReviewStep },
]

function ApplicationFormContent() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any>(null)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const { t } = useLanguage()

  // Check if we're in an embedded context
  const isEmbedded = typeof window !== 'undefined' && window.parent !== window

  // Handle iframe height communication
  useIframeHeight()

  // Send progress updates to parent window (embed)
  const sendProgressUpdate = () => {
    if (isEmbedded) {
      window.parent.postMessage({
        type: 'step_change',
        currentStep: currentStep,
        completedSteps: completedSteps,
        totalSteps: STEPS.length
      }, '*')
    }
  }

  // Listen for navigation messages from parent
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'navigate_to_step') {
        const stepIndex = event.data.stepIndex
        if (stepIndex >= 0 && stepIndex < STEPS.length) {
          setCurrentStep(stepIndex)
        }
      }
      if (event.data.type === 'language_change') {
        // Language changes are handled by the LanguageContext
        const newLanguage = event.data.language
        // The LanguageContext should handle this automatically
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Send progress update when step or completion changes
  React.useEffect(() => {
    sendProgressUpdate()
  }, [currentStep, completedSteps])

  // Define required fields for each step
  const getStepRequiredFields = (stepIndex: number): (keyof ValidatedApplicationData)[] => {
    switch (stepIndex) {
      case 0: // Personal Information
        return ['legalFirstName', 'legalLastName', 'socialSecurityNumber']
      case 1: // Contact Details
        return ['streetAddress', 'city', 'state', 'zipCode', 'phoneNumber', 'emergencyName', 'emergencyPhone', 'emergencyRelationship']
      case 2: // Work Authorization
        const baseFields: (keyof ValidatedApplicationData)[] = ['citizenshipStatus', 'age18', 'transportation', 'workAuthorizationConfirm']
        const currentCitizenship = form.watch('citizenshipStatus')
        
        if (currentCitizenship === 'lawful_permanent') {
          return [...baseFields, 'uscisANumber']
        } else if (currentCitizenship === 'alien_authorized') {
          return [...baseFields, 'workAuthExpiration', 'alienDocumentType', 'alienDocumentNumber', 'documentCountry']
        }
        return baseFields
      case 3: // Position & Experience
        return ['positionApplied', 'jobDiscovery']
      case 4: // Availability
        return ['fullTimeEmployment', 'swingShifts', 'graveyardShifts', 'previouslyApplied']
      case 5: // Education & Employment
        return [] // Optional sections
      case 6: // Documents
        return [] // Optional for now
      case 7: // Review
        return [] // Final review step
      default:
        return []
    }
  }

  // Check if current step is valid
  const isCurrentStepValid = () => {
    const requiredFields = getStepRequiredFields(currentStep)
    const formValues = form.watch() // Use watch to make it reactive
    const formState = form.formState
    
    // Check that all required fields are filled AND don't have validation errors
    return requiredFields.every(field => {
      const value = formValues[field]
      const hasValue = value !== undefined && value !== null && value !== ''
      const hasNoError = !formState.errors[field]
      return hasValue && hasNoError
    })
  }

  // Check if all required fields across all steps are valid for submission
  const isFormReadyForSubmission = () => {
    const formValues = form.watch()
    const formState = form.formState
    
    // Get all required fields from all steps
    const allRequiredFields: (keyof ValidatedApplicationData)[] = []
    for (let i = 0; i < STEPS.length - 1; i++) { // Exclude review step
      allRequiredFields.push(...getStepRequiredFields(i))
    }
    
    // Check that all core required fields are filled and valid
    return allRequiredFields.every(field => {
      const value = formValues[field]
      const hasValue = value !== undefined && value !== null && value !== ''
      const hasNoError = !formState.errors[field]
      return hasValue && hasNoError
    })
  }

  const form = useForm<ValidatedApplicationData>({
    resolver: zodResolver(applicationSchema),
    mode: 'onChange',
    defaultValues: {
      submissionId: '',
      legalFirstName: '',
      legalLastName: '',
      otherLastNames: '',
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      phoneNumber: '',
      homePhone: '',
      cellPhone: '',
      socialSecurityNumber: '',
      dateOfBirth: '',
      email: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelationship: '',
      citizenshipStatus: '',
      workAuthorization: '',
      age18: '',
      transportation: '',
      workAuthorizationConfirm: '',
      positionApplied: '',
      expectedSalary: '',
      jobDiscovery: '',
      fullTimeEmployment: '',
      swingShifts: '',
      graveyardShifts: '',
      previouslyApplied: '',
      previousApplicationWhen: '',
      education: [],
      employment: [],
      submittedAt: '',
      documents: []
    }
  })

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      // Mark current step as completed when moving forward
      if (isCurrentStepValid() && !completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep])
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to completed steps or previous steps
    if (stepIndex <= currentStep || completedSteps.includes(stepIndex)) {
      setCurrentStep(stepIndex)
    }
  }

  const onSubmit = async (data: ValidatedApplicationData) => {
    setIsSubmitting(true)
    
    try {
      // Add timestamp and submission ID
      const submissionData = {
        ...data,
        submittedAt: new Date().toISOString(),
        submissionId: `APP-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      }

      console.log('Submitting application data:', {
        fields: Object.keys(submissionData).length,
        submissionId: submissionData.submissionId
      })

      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server response error:', errorText)
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('Submission successful:', result)
      
      setSubmissionResult(result)
      setCurrentStep(STEPS.length) // Go to success step
      
    } catch (error) {
      console.error('Submission error details:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(t('system.submission_failed', `Failed to submit application: ${errorMessage}`))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success step
  if (currentStep >= STEPS.length) {
    return (
      <div className="mx-auto px-4 py-4 max-w-4xl">
        <SuccessStep result={submissionResult} />
      </div>
    )
  }

  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <div className="mx-auto px-4 py-4 max-w-4xl">
      {/* Only show internal progress bar and language selector when NOT embedded */}
      {!isEmbedded && (
        <>
          {/* Language Selector */}
          <div className="mb-4 flex justify-end">
            <LanguageSelector variant="compact" />
          </div>

          <ProgressBar 
            currentStep={currentStep} 
            totalSteps={STEPS.length}
            steps={STEPS.map(s => t(s.titleKey, s.titleKey))}
            onStepClick={handleStepClick}
            completedSteps={completedSteps}
          />
        </>
      )}

      <FormStep title={t(STEPS[currentStep].titleKey, STEPS[currentStep].titleKey)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CurrentStepComponent 
            form={form}
            isSubmitting={isSubmitting}
            onEditStep={currentStep === STEPS.length - 1 ? setCurrentStep : undefined}
          />

          <FormNavigation
            currentStep={currentStep}
            totalSteps={STEPS.length}
            onNext={nextStep}
            onPrevious={prevStep}
            onSubmit={form.handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
            canProceed={currentStep === STEPS.length - 1 ? isFormReadyForSubmission() : isCurrentStepValid()}
          />
        </form>
      </FormStep>
    </div>
  )
}

export default function ApplicationForm() {
  return (
    <LanguageProvider>
      <ApplicationFormContent />
    </LanguageProvider>
  )
}