'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { navigateWithLanguage } from '../utils/navigation'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to first step while preserving language parameter
    navigateWithLanguage(router, '/step/personal', undefined, 'replace')
  }, [router])

  return null // Webflow embed handles loading display
}