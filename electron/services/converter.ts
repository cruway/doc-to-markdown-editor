import { ipcMain } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import mammoth from 'mammoth'
import { turndown } from './turndownInstance'
import { extractBase64ImagesFromMarkdown } from './imageExtractor'

// 統合ドキュメントの最大合計サイズ（100MB）
const MAX_MERGED_SIZE = 100 * 1024 * 1024

const SLOT_LABELS: Record<string, string> = {
  '起': '起',
  '承': '承',
  '転': '転',
  '結': '結',
}

async function convertDocxToMarkdown(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  const result = await mammoth.convertToHtml({ buffer })
  return turndown.turndown(result.value)
}

async function convertHtmlToMarkdown(filePath: string): Promise<string> {
  const html = await fs.readFile(filePath, 'utf-8')
  return turndown.turndown(html)
}

async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8')
}

export async function convertFile(filePath: string): Promise<string> {
  // [C-01] Google ドライブファイルはこの関数では処理できない
  if (filePath.startsWith('gdoc://') || filePath.startsWith('gsheet://')) {
    throw new Error(
      'Google ドライブファイルは file:convertToMarkdown では処理できません。' +
      'google:downloadDoc または google:downloadSheet を使用してください。'
    )
  }

  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.docx':
      return convertDocxToMarkdown(filePath)
    case '.html':
      return await convertHtmlToMarkdown(filePath)
    case '.md':
    case '.txt':
      return await readTextFile(filePath)
    default:
      throw new Error(`Unsupported file format: ${ext}`)
  }
}

interface MergeSlot {
  type: string
  files: Array<{ path: string }>
}

interface MergeOptions {
  separator?: 'hr' | 'heading' | 'none'
}

export function setupConverterHandlers() {
  // [P1-01] IPC ハンドラに try-catch 追加
  ipcMain.handle('file:convertToMarkdown', async (_event, filePath: string) => {
    try {
      return await convertFile(filePath)
    } catch (err) {
      throw new Error(`変換エラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle('file:mergeDocuments', async (_event, slots: MergeSlot[], options?: MergeOptions) => {
    try {
      const separator = options?.separator || 'hr'
      const sections: string[] = []

      for (const slot of slots) {
        if (!slot.files || slot.files.length === 0) continue

        const sectionParts: string[] = []
        let totalSize = 0
        for (const file of slot.files) {
          const md = await convertFile(file.path)
          totalSize += md.length
          if (totalSize > MAX_MERGED_SIZE) {
            throw new Error(`統合結果が最大サイズ（${MAX_MERGED_SIZE / 1024 / 1024}MB）を超えました`)
          }
          sectionParts.push(md)
        }

        const sectionContent = sectionParts.join('\n\n')

        if (separator === 'heading') {
          sections.push(`## ${SLOT_LABELS[slot.type] || slot.type}\n\n${sectionContent}`)
        } else {
          sections.push(sectionContent)
        }
      }

      const joinSeparator = separator === 'hr' ? '\n\n---\n\n' : '\n\n'
      return sections.join(joinSeparator)
    } catch (err) {
      throw new Error(`統合エラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle('file:extractImages', async (_event, markdown: string, outputDir: string) => {
    try {
      return extractBase64ImagesFromMarkdown(markdown, outputDir)
    } catch (err) {
      throw new Error(`画像抽出エラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })
}
