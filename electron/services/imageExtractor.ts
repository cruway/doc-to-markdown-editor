import fs from 'fs'
import path from 'path'

interface ExtractResult {
  html: string
  imageCount: number
}

// 1画像あたりの最大 base64 サイズ（50MB）
const MAX_IMAGE_BASE64_LENGTH = 50 * 1024 * 1024 * (4 / 3) // base64 は約 4/3 倍

function getAltText(imgTag: string): string {
  const match = imgTag.match(/alt="([^"]*)"/)
  return match ? match[1] : 'image'
}

function resolveOutputDir(outputDir: string): string {
  return path.resolve(outputDir)
}

function ensureImagesDir(imagesDir: string): void {
  try {
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'EEXIST') throw err
  }
}

export function extractBase64Images(html: string, outputDir: string): ExtractResult {
  const safeDir = resolveOutputDir(outputDir)
  const imagesDir = path.join(safeDir, 'images')

  // replace ごとに新しい RegExp を生成し lastIndex 汚染を防止
  const regex = /<img[^>]*src="data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,([^"]+)"[^>]*>/gi

  let dirCreated = false
  let imageCount = 0
  const processed = html.replace(regex, (fullMatch, ext, base64Data) => {
    // サイズ制限チェック
    if (base64Data.length > MAX_IMAGE_BASE64_LENGTH) {
      console.warn(`画像 ${imageCount + 1} がサイズ制限を超えています（${Math.round(base64Data.length / 1024 / 1024)}MB）。スキップします。`)
      return fullMatch
    }

    imageCount++
    if (!dirCreated) {
      ensureImagesDir(imagesDir)
      dirCreated = true
    }

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

  // 関数内ローカル regex で lastIndex 汚染を防止
  const regex = /!\[([^\]]*)\]\(data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,([^)]+)\)/gi

  let dirCreated = false
  let imageCount = 0
  const processed = markdown.replace(regex, (_fullMatch, alt, ext, base64Data) => {
    if (base64Data.length > MAX_IMAGE_BASE64_LENGTH) {
      console.warn(`画像 ${imageCount + 1} がサイズ制限を超えています。スキップします。`)
      return _fullMatch
    }

    imageCount++
    if (!dirCreated) {
      ensureImagesDir(imagesDir)
      dirCreated = true
    }

    const normalizedExt = ext.replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    const fileName = `image-${String(imageCount).padStart(3, '0')}.${normalizedExt}`
    const filePath = path.join(imagesDir, fileName)

    const buffer = Buffer.from(base64Data, 'base64')
    fs.writeFileSync(filePath, buffer)

    return `![${alt || 'image'}](./images/${fileName})`
  })

  return { markdown: processed, imageCount }
}
