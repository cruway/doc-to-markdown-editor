import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { extractBase64Images, extractBase64ImagesFromMarkdown } from '../imageExtractor'

// 1x1 pixel transparent PNG in base64
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

// 1x1 pixel red JPEG in base64
const TINY_JPG_BASE64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k='

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'img-extract-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('extractBase64Images (HTML)', () => {
  // T-06: base64 画像を含むドキュメント → 画像がローカルファイルに抽出される
  it('extracts PNG base64 image from HTML', () => {
    const html = `<p>Text</p><img src="data:image/png;base64,${TINY_PNG_BASE64}" alt="test image"><p>More</p>`

    const result = extractBase64Images(html, tmpDir)

    expect(result.imageCount).toBe(1)
    expect(result.html).toContain('src="./images/image-001.png"')
    expect(result.html).toContain('alt="test image"')
    expect(result.html).not.toContain('base64')

    const imgPath = path.join(tmpDir, 'images', 'image-001.png')
    expect(fs.existsSync(imgPath)).toBe(true)
    expect(fs.readFileSync(imgPath).length).toBeGreaterThan(0)
  })

  it('extracts multiple images with sequential numbering', () => {
    const html = `
      <img src="data:image/png;base64,${TINY_PNG_BASE64}" alt="first">
      <img src="data:image/jpeg;base64,${TINY_JPG_BASE64}" alt="second">
    `

    const result = extractBase64Images(html, tmpDir)

    expect(result.imageCount).toBe(2)
    expect(result.html).toContain('image-001.png')
    expect(result.html).toContain('image-002.jpg')

    expect(fs.existsSync(path.join(tmpDir, 'images', 'image-001.png'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'images', 'image-002.jpg'))).toBe(true)
  })

  it('returns original HTML and count 0 when no images', () => {
    const html = '<p>No images here</p>'
    const result = extractBase64Images(html, tmpDir)

    expect(result.imageCount).toBe(0)
    expect(result.html).toBe(html)
    expect(fs.existsSync(path.join(tmpDir, 'images'))).toBe(false)
  })

  it('uses "image" as default alt text when alt is missing', () => {
    const html = `<img src="data:image/png;base64,${TINY_PNG_BASE64}">`
    const result = extractBase64Images(html, tmpDir)

    expect(result.html).toContain('alt="image"')
  })
})

describe('extractBase64ImagesFromMarkdown', () => {
  it('extracts base64 image from markdown syntax', () => {
    const md = `# Title\n\n![diagram](data:image/png;base64,${TINY_PNG_BASE64})\n\nMore text.`

    const result = extractBase64ImagesFromMarkdown(md, tmpDir)

    expect(result.imageCount).toBe(1)
    expect(result.markdown).toContain('![diagram](./images/image-001.png)')
    expect(result.markdown).not.toContain('base64')
    expect(result.markdown).toContain('# Title')
    expect(result.markdown).toContain('More text.')

    expect(fs.existsSync(path.join(tmpDir, 'images', 'image-001.png'))).toBe(true)
  })

  it('extracts multiple images from markdown', () => {
    const md = `![a](data:image/png;base64,${TINY_PNG_BASE64})\n![b](data:image/jpeg;base64,${TINY_JPG_BASE64})`

    const result = extractBase64ImagesFromMarkdown(md, tmpDir)

    expect(result.imageCount).toBe(2)
    expect(result.markdown).toContain('![a](./images/image-001.png)')
    expect(result.markdown).toContain('![b](./images/image-002.jpg)')
  })

  it('handles empty alt text', () => {
    const md = `![](data:image/png;base64,${TINY_PNG_BASE64})`

    const result = extractBase64ImagesFromMarkdown(md, tmpDir)

    expect(result.markdown).toContain('![image](./images/image-001.png)')
  })

  it('returns original markdown when no images found', () => {
    const md = '# Title\n\nJust text, no images.'
    const result = extractBase64ImagesFromMarkdown(md, tmpDir)

    expect(result.imageCount).toBe(0)
    expect(result.markdown).toBe(md)
  })

  it('handles webp images', () => {
    // Using PNG data as a stand-in, just testing the extension handling
    const md = `![photo](data:image/webp;base64,${TINY_PNG_BASE64})`

    const result = extractBase64ImagesFromMarkdown(md, tmpDir)

    expect(result.imageCount).toBe(1)
    expect(result.markdown).toContain('image-001.webp')
  })
})
