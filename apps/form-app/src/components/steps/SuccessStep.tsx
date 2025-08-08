import { CheckCircle, Download, Home } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

interface SuccessStepProps {
  result: any
}

export function SuccessStep({ result }: SuccessStepProps) {
  const { t } = useLanguage()
  const [isDownloading, setIsDownloading] = useState(false)
  
  const handleStartNewApplication = () => {
    if (typeof window !== 'undefined') {
      console.log('🆕 Starting new application - clearing all data')
      // Preserve language preference during cleanup
      const languagePreference = sessionStorage.getItem('preferred-language')
      // Clear all form-related data
      sessionStorage.clear()
      // Restore language preference
      if (languagePreference) {
        sessionStorage.setItem('preferred-language', languagePreference)
      }
      // Redirect to first step
      window.location.href = '/step/1'
    }
  }
  
  // Scroll to top when success page loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Scroll within iframe
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Send message to parent window (webflow embed) to scroll to top
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ action: 'scrollToTop' }, '*')
          console.log('📜 Sent scrollToTop message to parent window')
        } catch (error) {
          console.warn('Failed to send scroll message to parent:', error)
        }
      }
    }
  }, [])

  // Clear form data from sessionStorage on successful submission
  useEffect(() => {
    if (typeof window !== 'undefined' && result?.success) {
      console.log('🧹 Clearing form data from sessionStorage after successful submission')
      sessionStorage.removeItem('wareworks-form-data')
      sessionStorage.removeItem('wareworks-submission-result')
      sessionStorage.removeItem('debug-state')
      
      // Also clear any language or other form-related storage
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.startsWith('wareworks-') || key.includes('form-data'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key))
    }
  }, [result])
  
  const handleDownload = async () => {
    if (!result?.submissionId) {
      alert(t('errors.no_submission_data'))
      return
    }
    
    setIsDownloading(true)
    
    try {
      // Check if we have a direct PDF URL from the submission result
      if (result.pdfUrl) {
        // Direct download from URL
        const link = document.createElement('a')
        link.href = result.pdfUrl
        link.download = `Wareworks_Application_${result.submissionId}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Request PDF generation/download from unified endpoint
        const response = await fetch(`/api/submit-application?download=${result.submissionId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        })
        
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`)
        }
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Wareworks_Application_${result.submissionId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert(t('errors.download_failed'))
    } finally {
      setIsDownloading(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-heading font-bold text-primary mb-2">
            {t('success.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('success.thank_you')}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-green-900 mb-4">{t('success.application_details')}</h2>
          <div className="text-sm text-green-800 space-y-2">
            <div>
              <span className="font-medium">{t('success.confirmation_id')}</span> {result?.submissionId || 'N/A'}
            </div>
            <div>
              <span className="font-medium">{t('success.submitted')}</span> {
                result?.timestamp 
                  ? new Date(result.timestamp).toLocaleString()
                  : new Date().toLocaleString()
              }
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">{t('success.whats_next')}</h2>
          <div className="text-sm text-blue-800 space-y-2 text-left">
            <p>{t('success.review_timeframe')}</p>
            <p>{t('success.email_confirmation')}</p>
            <p>{t('success.interview_contact')}</p>
            <p>{t('success.save_confirmation')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            {isDownloading ? t('success.downloading') || 'Downloading...' : t('success.download_confirmation')}
          </button>
          
          <a 
            href="https://wareworks.me" 
            target="_parent"
            className="btn-primary flex items-center justify-center gap-2 no-underline"
          >
            <Home size={20} />
            {t('success.return_home')}
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center mb-4">
            <button 
              onClick={handleStartNewApplication}
              className="text-sm text-gray-600 hover:text-primary underline"
            >
              Submit Another Application
            </button>
          </div>
          <p className="text-sm text-gray-500 text-center">
            {t('success.questions_text')}{' '}
            <a href="mailto:admins@warework.me" className="text-primary hover:underline">
              admins@warework.me
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}