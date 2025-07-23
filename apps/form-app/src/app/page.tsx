'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationSchema, type ValidatedApplicationData } from '../shared/validation/schemas'
import { FormStep } from '../components/FormStep'
import { FormNavigation } from '../components/FormNavigation'
import { ProgressBar } from '../components/ProgressBar'
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
import { translateKey, SubmissionResult } from '../types/translations'

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
  // Removed showLanding state - no more React landing page needed
  const [currentStep, setCurrentStep] = useState(0)
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  // Initialize form first
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

  // Check if we're in an embedded context
  const isEmbedded = typeof window !== 'undefined' && window.parent !== window

  // Robust iframe height communication
  useEffect(() => {
    if (!isEmbedded) return;

    let timeoutId: NodeJS.Timeout;
    
    const sendHeightToParent = () => {
      // Clear any pending timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Debounce to prevent excessive calls
      timeoutId = setTimeout(() => {
        try {
          // Get the full height of the document
          const bodyHeight = document.body.scrollHeight;
          const htmlHeight = document.documentElement.scrollHeight;
          const windowHeight = window.innerHeight;
          
          // Use the largest height value
          const height = Math.max(bodyHeight, htmlHeight, windowHeight);
          
          console.log('Sending height to parent:', height);
          
          window.parent.postMessage({
            type: 'iframe-resize',
            height: height,
            source: 'wareworks-form'
          }, '*');
        } catch (error) {
          console.warn('Could not send height to parent:', error);
        }
      }, 100);
    };

    // Send height immediately
    sendHeightToParent();

    // Send height when window resizes
    const handleResize = () => sendHeightToParent();
    window.addEventListener('resize', handleResize);

    // Send height when content changes
    const resizeObserver = new ResizeObserver(() => {
      sendHeightToParent();
    });

    // Observe body for size changes
    if (document.body) {
      resizeObserver.observe(document.body);
    }

    // Also send height when DOM changes (for dynamic content)
    const mutationObserver = new MutationObserver(() => {
      sendHeightToParent();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Send height periodically as fallback
    const interval = setInterval(sendHeightToParent, 2000);

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [isEmbedded]);

  
  // Add embedded class to body when in iframe
  useEffect(() => {
    if (isEmbedded && typeof document !== 'undefined') {
      document.body.classList.add('embedded')
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('embedded')
      }
    }
  }, [isEmbedded])

  // No more React landing page - Webflow embed handles language selection entirely

  // Send progress updates to parent window (embed)
  const sendProgressUpdate = useCallback(() => {
    if (isEmbedded) {
      // Use proper target origin instead of '*' for security
      const targetOrigin = window.location.origin.includes('localhost') 
        ? 'http://localhost:3000' 
        : window.location.origin.includes('wareworks-backend.netlify.app')
        ? 'https://www.wareworks.me'
        : window.location.origin
      
      window.parent.postMessage({
        type: 'step_change',
        currentStep: currentStep,
        completedSteps: completedSteps,
        totalSteps: STEPS.length
      }, targetOrigin)
    }
  }, [isEmbedded, currentStep, completedSteps.length])

  // Listen for navigation messages from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin for security
      const allowedOrigins = [
        'http://localhost:3000',
        'https://wareworks-backend.netlify.app',
        'https://www.wareworks.me',
        'https://wareworks.me',
        window.location.origin
      ]
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Rejected message from unauthorized origin:', event.origin)
        return
      }

      if (event.data.type === 'navigate_to_step') {
        const stepIndex = event.data.stepIndex
        if (typeof stepIndex === 'number' && stepIndex >= 0 && stepIndex < STEPS.length) {
          setCurrentStep(stepIndex)
        }
      }
      if (event.data.type === 'language_change') {
        // Language changes are handled by the LanguageContext
        const newLanguage = event.data.language
        if (newLanguage === 'en' || newLanguage === 'es') {
          // The LanguageContext should handle this automatically
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Send progress update when step or completion changes
  useEffect(() => {
    sendProgressUpdate()
  }, [sendProgressUpdate])

  // Memoized function to get required fields for each step based on schema validation
  const getStepRequiredFields = useMemo(() => {
    return (stepIndex: number): (keyof ValidatedApplicationData)[] => {
      switch (stepIndex) {
        case 0: // Personal Information - Only truly required fields per schema
          return ['legalFirstName', 'legalLastName', 'socialSecurityNumber']
        case 1: // Contact Details - Only address and phone required per schema
          return ['streetAddress', 'city', 'state', 'zipCode', 'phoneNumber']
        case 2: // Citizenship - Conditional requirements based on citizenship status
          const citizenshipStatus = formValues.citizenshipStatus
          if (citizenshipStatus === 'lawful_permanent') {
            return ['citizenshipStatus', 'uscisANumber']
          } else if (citizenshipStatus === 'alien_authorized') {
            return ['citizenshipStatus', 'workAuthExpiration', 'alienDocumentType', 'alienDocumentNumber', 'documentCountry']
          }
          return ['citizenshipStatus'] // At minimum, citizenship status should be selected
        case 3: // Position & Experience - All are optional per schema
          return []
        case 4: // Availability
          return ['fullTimeEmployment', 'swingShifts', 'graveyardShifts', 'previouslyApplied']
        case 5: // Education & Employment
          return [] // Optional sections
        case 6: // Documents
          return [] // Will check for ID document separately
        case 7: // Review
          return [] // Review step doesn't have new required fields
        default:
          return []
      }
    }
  }, [formValues.citizenshipStatus])

  // Memoized validation for current step
  const formValues = form.watch()
  const formState = form.formState
  
  const isCurrentStepValid = useMemo(() => {
    const requiredFields = getStepRequiredFields(currentStep)
    
    // Check that all required fields are filled AND don't have validation errors
    const fieldsValid = requiredFields.every(field => {
      const value = formValues[field]
      const hasValue = value !== undefined && value !== null && value !== ''
      const hasNoError = !formState.errors[field]
      return hasValue && hasNoError
    })
    
    // Special validation for documents step - require ID
    if (currentStep === 6) {
      const documents = formValues.documents || []
      const hasIDDocument = documents.some((doc: any) => doc.type === 'identification')
      return fieldsValid && hasIDDocument
    }
    
    return fieldsValid
  }, [currentStep, formValues, formState.errors, getStepRequiredFields])

  // Memoized validation for form submission readiness
  const isFormReadyForSubmission = useMemo(() => {
    // Check all required fields across all steps
    let allRequiredFields = [
      'legalFirstName', 'legalLastName', 'dateOfBirth', 'socialSecurityNumber',
      'streetAddress', 'city', 'state', 'zipCode', 'phoneNumber', 
      'emergencyName', 'emergencyPhone', 'emergencyRelationship',
      'citizenshipStatus', 'age18', 'transportation', 'workAuthorizationConfirm',
      'positionApplied', 'jobDiscovery',
      'fullTimeEmployment', 'swingShifts', 'graveyardShifts', 'previouslyApplied'
    ]
    
    // Add conditional citizenship requirements
    if (formValues.citizenshipStatus === 'lawful_permanent') {
      allRequiredFields.push('uscisANumber')
    } else if (formValues.citizenshipStatus === 'alien_authorized') {
      allRequiredFields.push('workAuthExpiration', 'alienDocumentType', 'alienDocumentNumber', 'documentCountry')
    }
    
    const requiredFieldsValid = allRequiredFields.every(field => {
      const value = formValues[field as keyof ValidatedApplicationData]
      const hasValue = value !== undefined && value !== null && value !== ''
      const hasNoError = !formState.errors[field as keyof ValidatedApplicationData]
      return hasValue && hasNoError
    })
    
    // Check for ID document - not strictly required for submission
    // const documents = formValues.documents || []
    // const hasIDDocument = documents.some((doc: any) => doc.type === 'identification')
    
    return requiredFieldsValid // && hasIDDocument
  }, [formValues, formState.errors])

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      // Mark current step as completed when moving forward
      if (isCurrentStepValid) {
        setCompletedSteps(prev => {
          // Prevent duplicates using Set
          const uniqueSteps = new Set([...prev, currentStep])
          return Array.from(uniqueSteps).sort((a, b) => a - b)
        })
      }
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, isCurrentStepValid])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleStepClick = useCallback((stepIndex: number) => {
    // Allow navigation to completed steps or previous steps
    if (stepIndex <= currentStep || completedSteps.includes(stepIndex)) {
      setCurrentStep(stepIndex)
    }
  }, [currentStep, completedSteps])

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

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`
        
        try {
          const errorText = await response.text()
          console.error('Server response error:', errorText)
          
          // Parse different error types
          if (response.status === 429) {
            errorMessage = 'Too many requests. Please try again in a few minutes.'
          } else if (response.status === 503) {
            errorMessage = 'Service temporarily unavailable. Please try again later.'
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.'
          } else if (response.status === 413) {
            errorMessage = 'Application data too large. Please check your uploaded files.'
          } else {
            errorMessage = errorText || errorMessage
          }
        } catch {
          // If error response is not readable, use generic message
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Submission successful:', result)
      
      setSubmissionResult(result)
      setCurrentStep(STEPS.length) // Go to success step
      
    } catch (error) {
      console.error('Submission error details:', error)
      
      let userFriendlyMessage = 'Failed to submit application. Please try again.'
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          userFriendlyMessage = 'Request timed out. Please check your connection and try again.'
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          userFriendlyMessage = 'Network error. Please check your internet connection and try again.'
        } else {
          userFriendlyMessage = error.message
        }
      }
      
      alert(t('embed.error_occurred') + ': ' + userFriendlyMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success step
  if (currentStep >= STEPS.length) {
    return (
      <div className={`mx-auto px-4 py-4 ${isEmbedded ? 'w-full max-w-none' : 'max-w-4xl'}`}>
        <SuccessStep result={submissionResult} />
      </div>
    )
  }

  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <div className={`mx-auto px-4 py-4 ${isEmbedded ? 'w-full max-w-none' : 'max-w-4xl'}`}>
      <ProgressBar 
        currentStep={currentStep}
        totalSteps={STEPS.length}
        steps={STEPS.map(step => translateKey(t, step.titleKey))}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
      />

      <FormStep title={translateKey(t, STEPS[currentStep].titleKey)}>
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
            canProceed={currentStep === STEPS.length - 1 ? isFormReadyForSubmission : isCurrentStepValid}
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