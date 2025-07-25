import { Shield, ShieldAlert, Loader2 } from 'lucide-react'
import { useCSRFToken } from '../hooks/useCSRFToken'

export function CSRFStatus() {
  const { token, isLoading, error } = useCSRFToken()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
        <Loader2 size={16} className="animate-spin" />
        <span>Initializing security...</span>
      </div>
    )
  }

  if (error || !token) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
        <ShieldAlert size={16} />
        <span>Security initialization failed</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-200">
      <Shield size={16} />
      <span>Form protected against CSRF attacks</span>
    </div>
  )
}