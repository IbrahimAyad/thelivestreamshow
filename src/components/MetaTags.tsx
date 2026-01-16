import { useEffect } from 'react'

interface MetaTagsProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

export function MetaTags({
  title = 'The Live Stream Show | Purposeful Illusion',
  description = 'The Live Stream Show - Purposeful Illusion. Live debates, morning shows, gaming streams, and unfiltered conversations. Season 4 now streaming.',
  image = 'https://thelivestreamshow.com/og-default.jpg',
  url = 'https://thelivestreamshow.com',
  type = 'website'
}: MetaTagsProps) {

  useEffect(() => {
    // Check URL hash on initial load to set correct meta tags
    const hash = window.location.hash
    let effectiveImage = image
    let effectiveTitle = title
    let effectiveDescription = description
    let effectiveUrl = url

    // Override with game meta if hash is #game
    if (hash === '#game') {
      effectiveImage = META_CONFIGS.game.image
      effectiveTitle = META_CONFIGS.game.title
      effectiveDescription = META_CONFIGS.game.description
      effectiveUrl = META_CONFIGS.game.url
    }
    // Override with book meta if hash is #book
    else if (hash === '#book') {
      effectiveImage = META_CONFIGS.book.image
      effectiveTitle = META_CONFIGS.book.title
      effectiveDescription = META_CONFIGS.book.description
      effectiveUrl = META_CONFIGS.book.url
    }

    // Update document title
    document.title = effectiveTitle

    // Helper function to update or create meta tag
    const setMetaTag = (property: string, content: string, isName = false) => {
      const attr = isName ? 'name' : 'property'
      let element = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement

      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attr, property)
        document.head.appendChild(element)
      }
      element.content = content
    }

    // Update all meta tags
    setMetaTag('description', effectiveDescription, true)
    setMetaTag('og:title', effectiveTitle)
    setMetaTag('og:description', effectiveDescription)
    setMetaTag('og:image', effectiveImage)
    setMetaTag('og:url', effectiveUrl)
    setMetaTag('og:type', type)
    setMetaTag('twitter:card', 'summary_large_image', true)
    setMetaTag('twitter:title', effectiveTitle, true)
    setMetaTag('twitter:description', effectiveDescription, true)
    setMetaTag('twitter:image', effectiveImage, true)
  }, [title, description, image, url, type])

  return null
}

// Predefined meta configurations
export const META_CONFIGS = {
  default: {
    title: 'The Live Stream Show | Purposeful Illusion',
    description: 'The Live Stream Show - Purposeful Illusion. Live debates, morning shows, gaming streams, and unfiltered conversations. Season 4 now streaming.',
    image: 'https://thelivestreamshow.com/og-default.jpg',
    url: 'https://thelivestreamshow.com'
  },
  game: {
    title: 'Big Time Lucky 13 | The Live Stream Show',
    description: 'Where Destiny Meets Fortune - Experience the thrill of high-end slot gaming reimagined for streaming entertainment. Pure fun, no gambling.',
    image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/12ae2f85-70ac-4009-8400-6c680a6c1300/public',
    url: 'https://thelivestreamshow.com/#game'
  },
  book: {
    title: 'The Thirteenth Month | The Live Stream Show',
    description: 'Read The Thirteenth Month - An epic journey through time, reality, and the spaces between. Available now.',
    image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/df3ab7be-ff4d-4623-8708-7eb55dcb8a00/public',
    url: 'https://thelivestreamshow.com/#book'
  }
}
