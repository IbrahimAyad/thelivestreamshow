import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const htmlPath = path.join(__dirname, '../public/morning-show-intro.html')
const outputDir = path.join(__dirname, '../public/morning-show')

async function extractImages() {
  console.log('📸 Extracting images from morning show intro...\n')

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Read HTML file
  const html = fs.readFileSync(htmlPath, 'utf-8')

  // Extract base64 images
  const imgRegex = /<img[^>]+src="data:image\/(webp|jpeg|png);base64,([^"]+)"/g
  const matches = [...html.matchAll(imgRegex)]

  console.log(`Found ${matches.length} images\n`)

  matches.forEach((match, index) => {
    const format = match[1]
    const base64Data = match[2]
    const imageNumber = index + 1

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Save to file
    const filename = `morning-show-${imageNumber}.${format}`
    const filepath = path.join(outputDir, filename)

    fs.writeFileSync(filepath, imageBuffer)

    const sizeKB = (imageBuffer.length / 1024).toFixed(2)
    console.log(`✓ Saved: ${filename} (${sizeKB} KB)`)
  })

  console.log('\n✅ All images extracted successfully!')
}

extractImages()
