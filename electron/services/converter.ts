import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'
import { turndown } from './turndownInstance'
import { extractBase64ImagesFromMarkdown } from './imageExtractor'

const SLOT_LABELS: Record<string, string> = {
  '起': '起',
  '承': '承',
  '転': '転',
  '結': '結',
}

async function convertDocxToMarkdown(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath)
  const result = await mammoth.convertToHtml({ buffer })
  return turndown.turndown(result.value)
}

function convertHtmlToMarkdown(filePath: string): string {
  const html = fs.readFileSync(filePath, 'utf-8')
  return turndown.turndown(html)
}

function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

async function convertFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.docx':
      return convertDocxToMarkdown(filePath)
    case '.html':
      return convertHtmlToMarkdown(filePath)
    case '.md':
    case '.txt':
      return readTextFile(filePath)
    default:
      throw new Error(`Unsupported file format: ${ext}`)
  }
}

function getSeparator(type: string, slotType?: string): string {
  switch (type) {
    case 'heading':
      return slotType ? `\n\n## ${SLOT_LABELS[slotType] || slotType}\n\n` : '\n\n'
    case 'none':
      return '\n\n'
    case 'hr':
    default:
      return '\n\n---\n\n'
  }
}

export function setupConverterHandlers() {
  ipcMain.handle('file:convertToMarkdown', async (_event, filePath: string) => {
    return convertFile(filePath)
  })

  ipcMain.handle('file:mergeDocuments', async (_event, slots: any[], options?: any) => {
    const separator = options?.separator || 'hr'
    const sections: string[] = []

    for (const slot of slots) {
      if (!slot.files || slot.files.length === 0) continue

      const sectionParts: string[] = []
      for (const file of slot.files) {
        const md = await convertFile(file.path)
        sectionParts.push(md)
      }

      const sectionContent = sectionParts.join('\n\n')

      if (separator === 'heading') {
        sections.push(`## ${SLOT_LABELS[slot.type] || slot.type}\n\n${sectionContent}`)
      } else {
        sections.push(sectionContent)
      }
    }

    const joinSeparator = separator === 'heading' ? '\n\n' : getSeparator(separator)
    return sections.join(joinSeparator)
  })

  ipcMain.handle('file:extractImages', async (_event, markdown: string, outputDir: string) => {
    return extractBase64ImagesFromMarkdown(markdown, outputDir)
  })
}
