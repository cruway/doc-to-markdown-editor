import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'

// [L-02] ローカルスキャン専用。.gsheet はローカルに存在しないため除外。
// Google Sheets は googleService.ts の scanFolder で処理される。
const SUPPORTED_EXTENSIONS = ['.docx', '.md', '.html', '.txt', '.gdoc']

// [L-03] LocalFile 型は src/types/index.ts で一元管理。
// electron → src の直接 import はビルド構成上困難なため、
// ここではローカルスキャン用の最小型を定義。
interface LocalFileLocal {
  path: string
  name: string
  extension: string
  size: number
  lastModified: number
}

function classifySlot(fileName: string): '起' | '承' | '転' | '結' | null {
  const name = fileName.toLowerCase()
  if (name.includes('起') || name.includes('intro') || name.includes('opening')) return '起'
  if (name.includes('承') || name.includes('body') || name.includes('main')) return '承'
  if (name.includes('転') || name.includes('twist') || name.includes('turn')) return '転'
  if (name.includes('結') || name.includes('conclusion') || name.includes('ending')) return '結'
  return null
}

export function setupFileHandlers() {
  ipcMain.handle('file:scanFolder', async (_event, folderPath: string) => {
    const slots = {
      '起': [] as LocalFileLocal[],
      '承': [] as LocalFileLocal[],
      '転': [] as LocalFileLocal[],
      '結': [] as LocalFileLocal[],
      'unclassified': [] as LocalFileLocal[],
    }

    const files = fs.readdirSync(folderPath)
    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const stat = fs.statSync(filePath)
      if (!stat.isFile()) continue

      const ext = path.extname(file).toLowerCase()
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue

      const localFile: LocalFileLocal = {
        path: filePath,
        name: file,
        extension: ext,
        size: stat.size,
        lastModified: stat.mtimeMs,
      }

      const slot = classifySlot(file)
      if (slot) {
        slots[slot].push(localFile)
      } else {
        slots.unclassified.push(localFile)
      }
    }

    return slots
  })

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'フォルダを選択',
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('dialog:openFiles', async (_event, extensions: string[]) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'ファイルを選択',
      filters: [
        { name: 'Documents', extensions: extensions || ['docx', 'md', 'html', 'txt'] },
      ],
    })

    if (result.canceled) return []

    return result.filePaths.map((filePath) => {
      const stat = fs.statSync(filePath)
      return {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath).toLowerCase(),
        size: stat.size,
        lastModified: stat.mtimeMs,
      }
    })
  })

  ipcMain.handle('dialog:saveFile', async (_event, content: string, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      title: '保存先を選択',
      defaultPath: defaultName,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    })

    if (result.canceled || !result.filePath) return null

    fs.writeFileSync(result.filePath, content, 'utf-8')
    return result.filePath
  })

  ipcMain.handle('file:saveToPath', async (_event, content: string, filePath: string) => {
    fs.writeFileSync(filePath, content, 'utf-8')
    return filePath
  })
}
