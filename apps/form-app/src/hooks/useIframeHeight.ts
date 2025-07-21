import { useEffect, useRef } from 'react'

export function useIframeHeight() {
  const lastHeightRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Debounced function to send height to parent window
    const sendHeightToParent = () => {
      if (window.parent && window.parent !== window) {
        const height = document.body.scrollHeight
        
        // Only send if height has changed significantly (at least 5px difference)
        if (Math.abs(height - lastHeightRef.current) > 5) {
          lastHeightRef.current = height
          
          // Use proper target origin instead of '*' for security
          const targetOrigin = window.location.origin.includes('localhost') 
            ? 'http://localhost:3000' 
            : window.location.origin
          
          window.parent.postMessage({
            type: 'resize',
            height: height
          }, targetOrigin)
          console.log('Iframe height adjusted to:', height + 'px')
        }
      }
    }

    // Debounced version to prevent excessive calls
    const debouncedSendHeight = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(sendHeightToParent, 200)
    }

    // Send height immediately
    sendHeightToParent()

    // Send height on window resize
    const handleResize = () => {
      debouncedSendHeight()
    }

    window.addEventListener('resize', handleResize)

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      debouncedSendHeight()
    })

    // Observe the document body
    resizeObserver.observe(document.body)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}