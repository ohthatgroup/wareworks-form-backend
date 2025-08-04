'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void
  error?: string
}

export interface SignaturePadRef {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ onSignatureChange, error }, ref) => {
  const [signatureName, setSignatureName] = useState('')
  const { t } = useLanguage()

  useImperativeHandle(ref, () => ({
    clear: () => {
      setSignatureName('')
      onSignatureChange(null)
    },
    isEmpty: () => {
      return !signatureName.trim()
    },
    toDataURL: () => {
      // Return the signature name as the "data"
      return signatureName.trim() || ''
    }
  }))

  const handleSignatureChange = (value: string) => {
    setSignatureName(value)
    onSignatureChange(value.trim() || null)
  }

  return (
    <div className="space-y-2">
      <label className="form-label">
        {t('signature.label')} <span className="text-red-500">*</span>
      </label>
      
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <input
          type="text"
          value={signatureName}
          onChange={(e) => handleSignatureChange(e.target.value)}
          placeholder="Type your full name"
          className="w-full text-2xl border-0 outline-none bg-transparent"
          style={{ 
            fontFamily: 'Brush Script MT, cursive, serif',
            fontStyle: 'italic',
            color: '#1f2937'
          }}
        />
        
        {signatureName && (
          <div className="mt-3 p-3 bg-gray-50 rounded border">
            <p className="text-sm text-gray-600 mb-2">Signature Preview:</p>
            <div 
              className="text-3xl text-center py-2"
              style={{ 
                fontFamily: 'Brush Script MT, cursive, serif',
                fontStyle: 'italic',
                color: '#1f2937',
                borderBottom: '1px solid #6b7280'
              }}
            >
              {signatureName}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
          <p className="text-sm text-gray-600">
            Type your full name to create your signature
          </p>
          <button
            type="button"
            onClick={() => ref && 'current' in ref && ref.current?.clear()}
            className="text-sm text-primary hover:text-primary/80 underline"
          >
            {t('signature.clear')}
          </button>
        </div>
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
})

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad