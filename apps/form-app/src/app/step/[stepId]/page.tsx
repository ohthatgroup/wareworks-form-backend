'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationSchema, type ValidatedApplicationData } from '../../../../../../shared/validation/schemas'
import { FormStep } from '../../../components/FormStep'
import { FormNavigation } from '../../../components/FormNavigation'
import { ProgressBar } from '../../../components/ProgressBar'
import { PersonalInfoStep } from '../../../components/steps/PersonalInfoStep'
import { ContactInfoStep } from '../../../components/steps/ContactInfoStep'
import { CitizenshipStep } from '../../../components/steps/CitizenshipStep'
import { PositionStep } from '../../../components/steps/PositionStep'
import { AvailabilityStep } from '../../../components/steps/AvailabilityStep'
import { EducationEmploymentStep } from '../../../components/steps/EducationEmploymentStep'
import { DocumentsStep } from '../../../components/steps/DocumentsStep'
import { ReviewStep } from '../../../components/steps/ReviewStep'
import { SuccessStep } from '../../../components/steps/SuccessStep'
import { LanguageProvider, useLanguage } from '../../../contexts/LanguageContext'
import { translateKey, SubmissionResult } from '../../../types/translations'
import { useCSRFProtectedFetch } from '../../../hooks/useCSRFToken'

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

const FORM_DATA_KEY = 'wareworks-form-data'
const SUBMISSION_RESULT_KEY = 'wareworks-submission-result'

function ApplicationFormContent() {
  const router = useRouter()
  const params = useParams()
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const csrfFetch = useCSRFProtectedFetch()

  // Get current step index from URL
  const currentStepId = params.stepId as string
  const currentStep = STEPS.findIndex(step => step.id === currentStepId)
  
  // Redirect to first step if invalid step
  useEffect(() => {
    if (currentStepId === 'success') return // Allow success step
    if (currentStep === -1 && currentStepId) {
      router.replace('/step/personal')
    }
  }, [currentStepId, currentStep, router])

  // Initialize form
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

  // Load form data from storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(FORM_DATA_KEY)
      const savedResult = localStorage.getItem(SUBMISSION_RESULT_KEY)
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          form.reset(parsedData.formData)
          setCompletedSteps(parsedData.completedSteps || [])
        } catch (error) {
          console.error('Error loading saved form data:', error)
        }
      }
      
      if (savedResult) {
        try {
          const parsedResult = JSON.parse(savedResult)
          setSubmissionResult(parsedResult)
        } catch (error) {
          console.error('Error loading submission result:', error)
        }
      }
    }
  }, [form])

  // Save form data to storage whenever it changes
  const formValues = form.watch()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timeoutId = setTimeout(() => {
        const dataToSave = {
          formData: formValues,
          completedSteps,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(FORM_DATA_KEY, JSON.stringify(dataToSave))
        // Also save to sessionStorage as backup
        sessionStorage.setItem(FORM_DATA_KEY, JSON.stringify(dataToSave))
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [formValues, completedSteps])

  // Check if we're in an embedded context
  const isEmbedded = typeof window !== 'undefined' && window.parent !== window

  // Robust iframe height communication
  useEffect(() => {
    if (!isEmbedded) return;

    let timeoutId: NodeJS.Timeout;
    
    const sendHeightToParent = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        try {
          const bodyHeight = document.body.scrollHeight;
          const htmlHeight = document.documentElement.scrollHeight;
          const windowHeight = window.innerHeight;
          const height = Math.max(bodyHeight, htmlHeight, windowHeight);
          
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

    sendHeightToParent();
    const handleResize = () => sendHeightToParent();
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      sendHeightToParent();
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }

    const mutationObserver = new MutationObserver(() => {
      sendHeightToParent();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    const interval = setInterval(sendHeightToParent, 2000);

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

  // Send progress updates to parent window (embed)
  const sendProgressUpdate = useCallback(() => {
    if (isEmbedded) {
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
  }, [isEmbedded, currentStep, completedSteps])

  // Listen for navigation messages from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
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
          const stepId = STEPS[stepIndex].id
          router.push(`/step/${stepId}`)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  // Send progress update when step changes
  useEffect(() => {
    sendProgressUpdate()
  }, [sendProgressUpdate])

  // Form validation logic
  const formState = form.formState

  const getStepRequiredFields = useMemo(() => {
    return (stepIndex: number): (keyof ValidatedApplicationData)[] => {
      switch (stepIndex) {
        case 0: // Personal Information
          return ['legalFirstName', 'legalLastName', 'socialSecurityNumber']
        case 1: // Contact Details
          return ['streetAddress', 'city', 'state', 'zipCode', 'phoneNumber', 'email']
        case 2: // Citizenship
          const citizenshipStatus = formValues.citizenshipStatus
          if (citizenshipStatus === 'lawful_permanent') {
            return ['citizenshipStatus', 'uscisANumber']
          } else if (citizenshipStatus === 'alien_authorized') {
            return ['citizenshipStatus', 'workAuthExpiration', 'alienDocumentType', 'alienDocumentNumber', 'documentCountry']
          }
          return []
        case 3: // Position & Experience
          return []
        case 4: // Availability
          return []
        case 5: // Education & Employment
          return []
        case 6: // Documents
          return []
        case 7: // Review
          return []
        default:
          return []
      }
    }
  }, [formValues.citizenshipStatus])
  
  const isCurrentStepValid = useMemo(() => {
    if (currentStep === -1) return false
    
    const requiredFields = getStepRequiredFields(currentStep)
    
    const fieldsValid = requiredFields.every(field => {
      const value = formValues[field]
      const hasValue = value !== undefined && value !== null && value !== ''
      const hasNoError = !formState.errors[field]
      return hasValue && hasNoError
    })
    
    if (currentStep === 6) {
      const documents = formValues.documents || []
      const hasIDDocument = documents.some((doc: any) => doc.type === 'identification')
      return fieldsValid && hasIDDocument
    }
    
    return fieldsValid
  }, [currentStep, formValues, formState.errors, getStepRequiredFields])

  const isFormReadyForSubmission = useMemo(() => {
    let allRequiredFields = [
      'legalFirstName', 'legalLastName', 'socialSecurityNumber',
      'streetAddress', 'city', 'state', 'zipCode', 'phoneNumber', 'email'
    ]
    
    if (formValues.citizenshipStatus === 'lawful_permanent') {
      allRequiredFields.push('citizenshipStatus', 'uscisANumber')
    } else if (formValues.citizenshipStatus === 'alien_authorized') {
      allRequiredFields.push('citizenshipStatus', 'workAuthExpiration', 'alienDocumentType', 'alienDocumentNumber', 'documentCountry')
    } else if (formValues.citizenshipStatus) {
      allRequiredFields.push('citizenshipStatus')
    }
    
    const requiredFieldsValid = allRequiredFields.every(field => {
      const value = formValues[field as keyof ValidatedApplicationData]
      const hasValue = value !== undefined && value !== null && value !== ''
      const hasNoError = !formState.errors[field as keyof ValidatedApplicationData]
      return hasValue && hasNoError
    })
    
    // Only log when submit is blocked (can't submit) and state changes
    if (!requiredFieldsValid) {
      const missingFields = allRequiredFields.filter(field => {
        const value = formValues[field as keyof ValidatedApplicationData]
        return value === undefined || value === null || value === ''
      })
      
      const errorFields = Object.keys(formState.errors)
      const currentState = JSON.stringify({ missingFields, errorFields })
      
      // Only log if the blocking state has changed
      if (typeof window !== 'undefined') {
        const lastState = sessionStorage.getItem('debug-state')
        if (lastState !== currentState) {
          console.log('🚫 SUBMIT BLOCKED - Here\'s why:')
          console.log('Required fields:', allRequiredFields)
          console.log('Missing fields:', missingFields)
          console.log('Fields with errors:', errorFields)
          console.log('================================')
          sessionStorage.setItem('debug-state', currentState)
        }
      }
    } else {
      // Clear debug state when form becomes valid
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('debug-state')
      }
    }
    
    return requiredFieldsValid
  }, [formValues, formState.errors])

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      if (isCurrentStepValid) {
        setCompletedSteps(prev => {
          const uniqueSteps = new Set([...prev, currentStep])
          return Array.from(uniqueSteps).sort((a, b) => a - b)
        })
      }
      const nextStepId = STEPS[currentStep + 1].id
      router.push(`/step/${nextStepId}`)
    }
  }, [currentStep, isCurrentStepValid, router])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStepId = STEPS[currentStep - 1].id
      router.push(`/step/${prevStepId}`)
    }
  }, [currentStep, router])

  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.includes(stepIndex)) {
      const stepId = STEPS[stepIndex].id
      router.push(`/step/${stepId}`)
    }
  }, [currentStep, completedSteps, router])

  const onSubmit = async (data: ValidatedApplicationData) => {
    setIsSubmitting(true)
    
    try {
      const submissionData = {
        ...data,
        submittedAt: new Date().toISOString(),
        submissionId: `APP-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await csrfFetch('/api/submit-application', {
        method: 'POST',
        body: JSON.stringify(submissionData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`
        
        try {
          const errorText = await response.text()
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
          // Use generic message if error response is not readable
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setSubmissionResult(result)
      
      // Save submission result to storage for download functionality
      if (typeof window !== 'undefined') {
        localStorage.setItem(SUBMISSION_RESULT_KEY, JSON.stringify(result))
      }
      
      router.push('/step/success')
      
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
  if (currentStepId === 'success') {
    return (
      <div className={`mx-auto px-4 py-4 ${isEmbedded ? 'w-full max-w-none' : 'max-w-4xl'}`}>
        <SuccessStep result={submissionResult} />
      </div>
    )
  }

  // Invalid step
  if (currentStep === -1) {
    return (
      <div className={`mx-auto px-4 py-4 ${isEmbedded ? 'w-full max-w-none' : 'max-w-4xl'}`}>
        <div className="text-center">Loading...</div>
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
            onEditStep={currentStep === STEPS.length - 1 ? (stepIndex: number) => {
              const stepId = STEPS[stepIndex].id
              router.push(`/step/${stepId}`)
            } : undefined}
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