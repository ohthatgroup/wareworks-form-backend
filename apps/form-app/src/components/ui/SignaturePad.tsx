'use client'

import { useRef, useImperativeHandle, forwardRef } from 'react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { t } = useLanguage()
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          onSignatureChange(null)
        }
      }
    },
    isEmpty: () => {
      const canvas = canvasRef.current
      if (!canvas) return true
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return true
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return imageData.data.every(value => value === 0)
    },
    toDataURL: () => {
      return canvasRef.current?.toDataURL() || ''
    }
  }))

  const setupCanvas = (canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
  }

  const getEventPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current = getEventPos(e)
  }

  const draw = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current || !lastPos.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentPos = getEventPos(e)
    
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(currentPos.x, currentPos.y)
    ctx.stroke()
    
    lastPos.current = currentPos
    onSignatureChange(canvas.toDataURL())
  }

  const stopDrawing = () => {
    isDrawing.current = false
    lastPos.current = null
  }

  const handleCanvasRef = (canvas: HTMLCanvasElement | null) => {
    if (canvas && canvasRef.current !== canvas) {
      canvasRef.current = canvas
      setupCanvas(canvas)
      
      // Mouse events
      canvas.addEventListener('mousedown', startDrawing)
      canvas.addEventListener('mousemove', draw)
      canvas.addEventListener('mouseup', stopDrawing)
      canvas.addEventListener('mouseout', stopDrawing)
      
      // Touch events
      canvas.addEventListener('touchstart', startDrawing)
      canvas.addEventListener('touchmove', draw)
      canvas.addEventListener('touchend', stopDrawing)
    } else if (!canvas && canvasRef.current) {
      // Cleanup when canvas is removed
      const currentCanvas = canvasRef.current
      currentCanvas.removeEventListener('mousedown', startDrawing)
      currentCanvas.removeEventListener('mousemove', draw)
      currentCanvas.removeEventListener('mouseup', stopDrawing)
      currentCanvas.removeEventListener('mouseout', stopDrawing)
      currentCanvas.removeEventListener('touchstart', startDrawing)
      currentCanvas.removeEventListener('touchmove', draw)
      currentCanvas.removeEventListener('touchend', stopDrawing)
      canvasRef.current = null
    }
  }

  return (
    <div className="space-y-2">
      <label className="form-label">
        {t('signature.label')} <span className="text-red-500">*</span>
      </label>
      
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <canvas
          ref={handleCanvasRef}
          className="w-full h-32 border border-gray-200 rounded cursor-crosshair touch-none bg-white"
          style={{ touchAction: 'none' }}
        />
        
        <div className="flex justify-between items-center mt-3">
          <p className="text-sm text-gray-600">
            {t('signature.instruction')}
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