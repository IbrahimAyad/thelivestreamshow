import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const bookDir = path.join(__dirname, '../public/book')
const bookCoverUrl = 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/df3ab7be-ff4d-4623-8708-7eb55dcb8a00/public'

// OG meta tags to add
const ogMetaTags = `
    <!-- Open Graph Meta Tags for Social Sharing -->
    <meta property="og:title" content="The Thirteenth Month | Chapter">
    <meta property="og:description" content="Read The Thirteenth Month - An epic journey through time, reality, and the spaces between.">
    <meta property="og:image" content="${bookCoverUrl}">
    <meta property="og:url" content="https://thelivestreamshow.com/book/">
    <meta property="og:type" content="book">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="The Thirteenth Month">
    <meta name="twitter:description" content="An epic journey through time, reality, and the spaces between.">
    <meta name="twitter:image" content="${bookCoverUrl}">`

async function addMetaTagsToChapters() {
  try {
    const files = fs.readdirSync(bookDir).filter(f => f.endsWith('.html') && f.startsWith('chapter-'))

    console.log(`Found ${files.length} chapter files to update...`)

    for (const file of files) {
      const filePath = path.join(bookDir, file)
      let content = fs.readFileSync(filePath, 'utf-8')

      // Check if OG tags already exist
      if (content.includes('og:image')) {
        console.log(`✓ ${file} already has OG tags, skipping...`)
        continue
      }

      // Extract chapter number and title from the file
      const titleMatch = content.match(/<title>(.*?)<\/title>/)
      const chapterTitle = titleMatch ? titleMatch[1] : 'The Thirteenth Month'

      // Insert OG tags after the description meta tag
      const descMatch = content.match(/(<meta name="description"[^>]*>)/)
      if (descMatch) {
        // Update OG title with specific chapter
        const customOgTags = ogMetaTags
          .replace('The Thirteenth Month | Chapter', chapterTitle)
          .replace(/content="https:\/\/thelivestreamshow\.com\/book\/">/, `content="https://thelivestreamshow.com/book/${file}">`)

        content = content.replace(
          descMatch[1],
          `${descMatch[1]}${customOgTags}`
        )

        fs.writeFileSync(filePath, content, 'utf-8')
        console.log(`✓ Updated ${file}`)
      } else {
        console.log(`⚠ Could not find description tag in ${file}`)
      }
    }

    console.log('\n✅ All chapter files updated successfully!')
  } catch (error) {
    console.error('Error updating chapter files:', error)
    process.exit(1)
  }
}

addMetaTagsToChapters()
