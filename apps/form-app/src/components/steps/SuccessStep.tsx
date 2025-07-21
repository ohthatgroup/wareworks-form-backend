import { CheckCircle, Download, Home } from 'lucide-react'

interface SuccessStepProps {
  result: any
}

export function SuccessStep({ result }: SuccessStepProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-heading font-bold text-primary mb-2">
            Application Submitted Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for your interest in joining the WareWorks team.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-green-900 mb-4">Application Details</h2>
          <div className="text-sm text-green-800 space-y-2">
            <div>
              <span className="font-medium">Confirmation ID:</span> {result?.submissionId || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Submitted:</span> {
                result?.timestamp 
                  ? new Date(result.timestamp).toLocaleString()
                  : new Date().toLocaleString()
              }
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">What's Next?</h2>
          <div className="text-sm text-blue-800 space-y-2 text-left">
            <p>• Our HR team will review your application within 5-7 business days</p>
            <p>• You'll receive an email confirmation at the address you provided</p>
            <p>• If selected for an interview, we'll contact you directly</p>
            <p>• Please save your confirmation ID for your records</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn-secondary flex items-center justify-center gap-2">
            <Download size={20} />
            Download Confirmation
          </button>
          
          <a 
            href="https://wareworks.me" 
            className="btn-primary flex items-center justify-center gap-2 no-underline"
          >
            <Home size={20} />
            Return to WareWorks
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Questions about your application? Contact us at{' '}
            <a href="mailto:hr@wareworks.me" className="text-primary hover:underline">
              hr@wareworks.me
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}