'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { applicationSchema, type ValidatedApplicationData } from '../../../shared/validation/schemas'
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

const STEPS = [
  { id: 'personal', title: 'Personal Information', component: PersonalInfoStep },
  { id: 'contact', title: 'Contact Details', component: ContactInfoStep },
  { id: 'citizenship', title: 'Work Authorization', component: CitizenshipStep },
  { id: 'position', title: 'Position & Experience', component: PositionStep },
  { id: 'availability', title: 'Availability & Preferences', component: AvailabilityStep },
  { id: 'education', title: 'Education & Employment', component: EducationEmploymentStep },
  { id: 'documents', title: 'Documents', component: DocumentsStep },
  { id: 'review', title: 'Review & Submit', component: ReviewStep },
]

export default function ApplicationForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any>(null)

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
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: ValidatedApplicationData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      
      if (response.ok) {
        setSubmissionResult(result)
        setCurrentStep(STEPS.length) // Go to success step
      } else {
        throw new Error(result.error || 'Submission failed')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success step
  if (currentStep >= STEPS.length) {
    return <SuccessStep result={submissionResult} />
  }

  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProgressBar 
        currentStep={currentStep} 
        totalSteps={STEPS.length}
        steps={STEPS.map(s => s.title)}
      />

      <FormStep title={STEPS[currentStep].title}>
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
            canProceed={form.formState.isValid}
          />
        </form>
      </FormStep>
    </div>
  )
}