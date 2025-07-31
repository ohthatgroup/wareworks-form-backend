'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to first step
    router.replace('/step/personal')
  }, [router])

  return null // Webflow embed handles loading display
}