import { useEffect } from 'react'

export function useIframeHeight() {
  useEffect(() => {
    // Function to send height to parent window
    const sendHeightToParent = () => {
      if (window.parent && window.parent !== window) {
        const height = document.body.scrollHeight
        window.parent.postMessage({
          type: 'resize',
          height: height
        }, '*')
      }
    }

    // Send height immediately
    sendHeightToParent()

    // Send height on window resize
    const handleResize = () => {
      setTimeout(sendHeightToParent, 100) // Small delay to ensure DOM is updated
    }

    window.addEventListener('resize', handleResize)

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(sendHeightToParent, 100)
    })

    // Observe the document body
    resizeObserver.observe(document.body)

    // Send height periodically to catch any missed changes
    const interval = setInterval(sendHeightToParent, 1000)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      clearInterval(interval)
    }
  }, [])
}