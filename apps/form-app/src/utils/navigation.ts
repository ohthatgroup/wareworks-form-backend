import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { Language } from '../translations'

/**
 * Navigation utilities to preserve language parameters across route changes
 */

/**
 * Extracts language parameter from current URL
 */
export function getCurrentLanguageFromUrl(): Language | null {
  if (typeof window === 'undefined') return null
  
  const urlParams = new URLSearchParams(window.location.search)
  const lang = urlParams.get('lang') as Language | null
  
  return (lang === 'en' || lang === 'es') ? lang : null
}

/**
 * Builds a URL with language parameter preserved
 */
export function buildUrlWithLanguage(path: string, language?: Language | null): string {
  // Remove leading slash if present for consistency
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Get language from parameter or current URL
  const lang = language || getCurrentLanguageFromUrl()
  
  // If no language found, return path as-is
  if (!lang) return `/${cleanPath}`
  
  // Build URL with language parameter
  const separator = cleanPath.includes('?') ? '&' : '?'
  return `/${cleanPath}${separator}lang=${lang}`
}

/**
 * Navigate to a path while preserving the current language parameter
 */
export function navigateWithLanguage(
  router: AppRouterInstance,
  path: string,
  language?: Language | null,
  method: 'push' | 'replace' = 'push'
): void {
  const urlWithLang = buildUrlWithLanguage(path, language)
  
  if (method === 'replace') {
    router.replace(urlWithLang)
  } else {
    router.push(urlWithLang)
  }
}

/**
 * Ensures current URL has language parameter, redirects if missing
 */
export function ensureLanguageInUrl(
  router: AppRouterInstance,
  currentPath: string,
  fallbackLanguage: Language = 'en'
): boolean {
  const currentLang = getCurrentLanguageFromUrl()
  
  if (!currentLang) {
    // No language in URL, add it
    const urlWithLang = buildUrlWithLanguage(currentPath, fallbackLanguage)
    router.replace(urlWithLang)
    return false // Indicates redirect happened
  }
  
  return true // URL already has language parameter
}