import fs from 'fs'
import path from 'path'

interface ExtractResult {
  html: string
  imageCount: number
}

// [C-03] /gi フラグだが String.replace() 専用のため lastIndex 問題なし。
// exec() で使用しないこと。
const BASE64_IMG_REGEX = /<img[^>]*src="data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,([^"]+)"[^>]*>/gi

function getAltText(imgTag: string): string {
  const match = imgTag.match(/alt="([^"]*)"/)
  return match ? match[1] : 'image'
}

// [P1-05] outputDir を正規化して安全性を確保
function resolveOutputDir(outputDir: string): string {
  return path.resolve(outputDir)
}

export function extractBase64Images(html: string, outputDir: string): ExtractResult {
  const safeDir = resolveOutputDir(outputDir)
  const imagesDir = path.join(safeDir, 'images')

  // [P1-06] ディレクトリを事前に作成（replace コールバック外）
  let hasImages = BASE64_IMG_REGEX.test(html)
  BASE64_IMG_REGEX.lastIndex = 0 // test() 後に lastIndex をリセット
  if (hasImages && !fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }

  let imageCount = 0
  const processed = html.replace(BASE64_IMG_REGEX, (fullMatch, ext, base64Data) => {
    imageCount++
    const normalizedExt = ext.replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    const fileName = `image-${String(imageCount).padStart(3, '0')}.${normalizedExt}`
    const filePath = path.join(imagesDir, fileName)

    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)

    const alt = getAltText(fullMatch)
    return `<img src="./images/${fileName}" alt="${alt}">`
  })

  return { html: processed, imageCount }
}

export function extractBase64ImagesFromMarkdown(markdown: string, outputDir: string): { markdown: string; imageCount: number } {
  const safeDir = resolveOutputDir(outputDir)
  const imagesDir = path.join(safeDir, 'images')

  const MD_BASE64_REGEX = /!\[([^\]]*)\]\(data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,([^)]+)\)/gi

  // [P1-06] ディレクトリを事前に作成
  const hasImages = MD_BASE64_REGEX.test(markdown)
  MD_BASE64_REGEX.lastIndex = 0
  if (hasImages && !fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }

  let imageCount = 0
  const processed = markdown.replace(MD_BASE64_REGEX, (_fullMatch, alt, ext, base64Data) => {
    imageCount++
    const normalizedExt = ext.replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    const fileName = `image-${String(imageCount).padStart(3, '0')}.${normalizedExt}`
    const filePath = path.join(imagesDir, fileName)

    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)

    return `![${alt || 'image'}](./images/${fileName})`
  })

  return { markdown: processed, imageCount }
}
