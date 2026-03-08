import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'
import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

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

export function setupConverterHandlers() {
  ipcMain.handle('file:convertToMarkdown', async (_event, filePath: string) => {
    return convertFile(filePath)
  })

  ipcMain.handle('file:mergeDocuments', async (_event, slots: any[]) => {
    const sections: string[] = []

    for (const slot of slots) {
      if (!slot.files || slot.files.length === 0) continue

      const sectionParts: string[] = []
      for (const file of slot.files) {
        const md = await convertFile(file.path)
        sectionParts.push(md)
      }

      sections.push(sectionParts.join('\n\n'))
    }

    return sections.join('\n\n---\n\n')
  })
}
