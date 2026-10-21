import { useEffect } from 'react'

export interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  og?: {
    title?: string
    description?: string
    image?: string
    imageWidth?: string
    imageHeight?: string
    type?: string
    url?: string
    siteName?: string
  }
  twitter?: {
    card?: 'summary' | 'summary_large_image'
    title?: string
    description?: string
    image?: string
  }
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
}

function updateMetaTag(attributeName: string, attributeValue: string, content: string | undefined) {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null

  if (!content) {
    if (element) {
      element.remove()
    }
    return
  }

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attributeName, attributeValue)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function updateLinkTag(rel: string, href: string | undefined) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null

  if (!href) {
    if (element) {
      element.remove()
    }
    return
  }

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

/**
 * Hook para gerenciar Meta Tags, OpenGraph, Canonical e Schema.org JSON-LD
 * inspirado nas melhores práticas de SEO (Open-SEO).
 */
export function useSEO({ title, description, canonical, og, twitter, jsonLd }: SEOProps) {
  useEffect(() => {
    // 1. Atualizar Título
    const originalTitle = document.title
    if (title) {
      document.title = title
    }

    // 2. Meta Description
    updateMetaTag('name', 'description', description)

    // 3. Canonical URL
    updateLinkTag('canonical', canonical || window.location.href)

    // 4. OpenGraph
    updateMetaTag('property', 'og:title', og?.title || title)
    updateMetaTag('property', 'og:description', og?.description || description)
    updateMetaTag('property', 'og:image', og?.image)
    if (og?.image) {
      updateMetaTag('property', 'og:image:width', og.imageWidth || '1200')
      updateMetaTag('property', 'og:image:height', og.imageHeight || '630')
    }
    updateMetaTag('property', 'og:url', og?.url || canonical || window.location.href)
    updateMetaTag('property', 'og:type', og?.type || 'website')
    updateMetaTag('property', 'og:locale', 'pt_BR')
    if (og?.siteName) {
      updateMetaTag('property', 'og:site_name', og.siteName)
    }

    // 5. Twitter Card
    updateMetaTag('name', 'twitter:card', twitter?.card || (og?.image ? 'summary_large_image' : 'summary'))
    updateMetaTag('name', 'twitter:title', twitter?.title || og?.title || title)
    updateMetaTag('name', 'twitter:description', twitter?.description || og?.description || description)
    if (twitter?.image || og?.image) {
      updateMetaTag('name', 'twitter:image', twitter?.image || og?.image)
    }

    // 6. Schema.org JSON-LD
    let scriptElement: HTMLScriptElement | null = null
    if (jsonLd) {
      scriptElement = document.createElement('script')
      scriptElement.setAttribute('type', 'application/ld+json')
      scriptElement.setAttribute('data-source', 'useSEO')
      scriptElement.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(scriptElement)
    }

    // Cleanup ao desmontar
    return () => {
      document.title = originalTitle
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement)
      }
    }
  }, [title, description, canonical, og?.title, og?.description, og?.image, og?.type, og?.url, twitter?.card, twitter?.title, twitter?.description, twitter?.image, jsonLd])
}
