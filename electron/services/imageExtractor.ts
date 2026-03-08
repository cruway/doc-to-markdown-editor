import fs from 'fs'
import path from 'path'

interface ExtractResult {
  html: string
  imageCount: number
}

const BASE64_IMG_REGEX = /<img[^>]*src="data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,([^"]+)"[^>]*>/gi

function getAltText(imgTag: string): string {
  const match = imgTag.match(/alt="([^"]*)"/)
  return match ? match[1] : 'image'
}

export function extractBase64Images(html: string, outputDir: string): ExtractResult {
  const imagesDir = path.join(outputDir, 'images')

  let imageCount = 0
  const processed = html.replace(BASE64_IMG_REGEX, (fullMatch, ext, base64Data) => {
    imageCount++
    const normalizedExt = ext.replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    const fileName = `image-${String(imageCount).padStart(3, '0')}.${normalizedExt}`
    const filePath = path.join(imagesDir, fileName)

    // Lazy create images directory
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)

    const alt = getAltText(fullMatch)
    return `<img src="./images/${fileName}" alt="${alt}">`
  })

  return { html: processed, imageCount }
}

export function extractBase64ImagesFromMarkdown(markdown: string, outputDir: string): { markdown: string; imageCount: number } {
  const imagesDir = path.join(outputDir, 'images')

  const MD_BASE64_REGEX = /!\[([^\]]*)\]\(data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,([^)]+)\)/gi

  let imageCount = 0
  const processed = markdown.replace(MD_BASE64_REGEX, (_fullMatch, alt, ext, base64Data) => {
    imageCount++
    const normalizedExt = ext.replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    const fileName = `image-${String(imageCount).padStart(3, '0')}.${normalizedExt}`
    const filePath = path.join(imagesDir, fileName)

    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)

    return `![${alt || 'image'}](./images/${fileName})`
  })

  return { markdown: processed, imageCount }
}
