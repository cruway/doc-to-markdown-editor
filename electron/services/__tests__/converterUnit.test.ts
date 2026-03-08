import { describe, it, expect } from 'vitest'
import { convertFile } from '../converter'
import fs from 'fs'
import path from 'path'
import os from 'os'

// P2-03: converter.ts の convertFile 関数テスト

describe('convertFile', () => {
  it('should throw for gdoc:// paths with clear error message', async () => {
    await expect(convertFile('gdoc://abc123')).rejects.toThrow(
      'Google ドライブファイルは file:convertToMarkdown では処理できません'
    )
  })

  it('should throw for gsheet:// paths with clear error message', async () => {
    await expect(convertFile('gsheet://abc123')).rejects.toThrow(
      'Google ドライブファイルは file:convertToMarkdown では処理できません'
    )
  })

  it('should throw for unsupported file formats', async () => {
    await expect(convertFile('/tmp/test.pdf')).rejects.toThrow('Unsupported file format: .pdf')
  })

  it('should read .md files as-is', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conv-test-'))
    const mdFile = path.join(tmpDir, 'test.md')
    fs.writeFileSync(mdFile, '# Hello\n\nWorld')
    try {
      const result = await convertFile(mdFile)
      expect(result).toBe('# Hello\n\nWorld')
    } finally {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })

  it('should read .txt files as-is', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conv-test-'))
    const txtFile = path.join(tmpDir, 'test.txt')
    fs.writeFileSync(txtFile, 'Plain text content')
    try {
      const result = await convertFile(txtFile)
      expect(result).toBe('Plain text content')
    } finally {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })

  it('should convert .html to markdown', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conv-test-'))
    const htmlFile = path.join(tmpDir, 'test.html')
    fs.writeFileSync(htmlFile, '<h1>Title</h1><p>Content</p>')
    try {
      const result = await convertFile(htmlFile)
      expect(result).toContain('Title')
      expect(result).toContain('Content')
    } finally {
      fs.rmSync(tmpDir, { recursive: true })
    }
  })

  it('should throw for non-existent files', async () => {
    await expect(convertFile('/nonexistent/path/file.md')).rejects.toThrow()
  })
})
