import { useState, useEffect, useCallback } from 'react'

interface CSRFTokenData {
  token: string
  tokenName: string
  headerName: string
}

interface UseCSRFTokenReturn {
  token: string | null
  isLoading: boolean
  error: string | null
  refreshToken: () => Promise<void>
  getHeaders: () => Record<string, string>
}

export function useCSRFToken(): UseCSRFTokenReturn {
  const [tokenData, setTokenData] = useState<CSRFTokenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include', // Include cookies for CSRF secret
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.token) {
        setTokenData({
          token: data.token,
          tokenName: data.tokenName || 'csrfToken',
          headerName: data.headerName || 'x-csrf-token'
        })
      } else {
        throw new Error('Invalid CSRF token response')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token'
      setError(errorMessage)
      console.error('CSRF token fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch token on mount
  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  // Refresh token function
  const refreshToken = useCallback(async () => {
    await fetchToken()
  }, [fetchToken])

  // Get headers for API requests
  const getHeaders = useCallback((): Record<string, string> => {
    if (!tokenData) {
      return {}
    }

    return {
      [tokenData.headerName]: tokenData.token,
      'Content-Type': 'application/json'
    }
  }, [tokenData])

  // Auto-refresh token periodically (every 45 minutes)
  useEffect(() => {
    if (!tokenData) return

    const refreshInterval = setInterval(() => {
      refreshToken()
    }, 45 * 60 * 1000) // 45 minutes

    return () => clearInterval(refreshInterval)
  }, [tokenData, refreshToken])

  return {
    token: tokenData?.token || null,
    isLoading,
    error,
    refreshToken,
    getHeaders
  }
}

// Hook for making CSRF-protected API requests
export function useCSRFProtectedFetch() {
  const { getHeaders, refreshToken } = useCSRFToken()

  const csrfFetch = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = {
      ...getHeaders(),
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Include CSRF secret cookie
    })

    // If CSRF token is invalid, try refreshing once
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}))
      
      if (errorData.error === 'CSRF Protection' || errorData.error === 'CSRF token invalid') {
        console.log('CSRF token invalid, refreshing...')
        await refreshToken()
        
        // Retry with new token
        const newHeaders = {
          ...getHeaders(),
          ...options.headers
        }
        
        return fetch(url, {
          ...options,
          headers: newHeaders,
          credentials: 'include'
        })
      }
    }

    return response
  }, [getHeaders, refreshToken])

  return csrfFetch
}