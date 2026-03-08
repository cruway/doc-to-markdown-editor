import { ipcMain, app, shell } from 'electron'
import { google, type drive_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { Readable } from 'stream'
import http from 'http'
import url from 'url'
import fs from 'fs'
import path from 'path'
import { turndown, cleanGoogleDocsHtml } from './turndownInstance'
import { csvToMarkdownTable } from './csvParser'

// [M-01] Google Drive API クエリ用 folderId バリデーション
function validateFolderId(folderId: string): string {
  if (!folderId) return ''
  if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) {
    throw new Error('不正なフォルダ ID です')
  }
  return folderId
}

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
]

function getConfigDir() {
  return path.join(app.getPath('userData'), 'google-auth')
}
function getTokenPath() {
  return path.join(getConfigDir(), 'token.json')
}
function getCredentialsPath() {
  return path.join(getConfigDir(), 'credentials.json')
}

// [P1-15] any → OAuth2Client 型
let oauth2Client: OAuth2Client | null = null

function ensureConfigDir() {
  const dir = getConfigDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// [P1-04] JSON.parse エラーハンドリング
function loadCredentials(): OAuth2Client | null {
  const credPath = getCredentialsPath()
  if (!fs.existsSync(credPath)) {
    return null
  }
  try {
    const content = fs.readFileSync(credPath, 'utf-8')
    const credentials = JSON.parse(content)
    const { client_id, client_secret } = credentials.installed || credentials.web
    oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333/callback')
    return oauth2Client
  } catch (err) {
    throw new Error(`credentials.json の読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`)
  }
}

function loadSavedToken(): boolean {
  const tokenPath = getTokenPath()
  if (!oauth2Client || !fs.existsSync(tokenPath)) return false
  try {
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))
    oauth2Client.setCredentials(token)
    return true
  } catch {
    // トークンファイルが破損している場合は無視して再認証を促す
    return false
  }
}

async function authenticateWithBrowser(): Promise<boolean> {
  if (!oauth2Client) {
    const loaded = loadCredentials()
    if (!loaded) throw new Error(`credentials.json が見つかりません。${getCredentialsPath()} を配置してください。`)
  }

  return new Promise((resolve, reject) => {
    const authUrl = oauth2Client!.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    })

    const server = http.createServer(async (req, res) => {
      try {
        const queryParams = new url.URL(req.url!, 'http://localhost:3333').searchParams
        const code = queryParams.get('code')
        if (!code) {
          res.end('認証コードが見つかりません。')
          return
        }

        const { tokens } = await oauth2Client!.getToken(code)
        oauth2Client!.setCredentials(tokens)

        ensureConfigDir()
        fs.writeFileSync(getTokenPath(), JSON.stringify(tokens))

        res.end('認証成功！このウィンドウを閉じてアプリに戻ってください。')
        server.close()
        resolve(true)
      } catch (err) {
        res.end('認証に失敗しました。')
        server.close()
        reject(err)
      }
    })

    // [P1-07] エラー時にサーバーを確実にクローズ
    server.on('error', (err: NodeJS.ErrnoException) => {
      server.close()
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        reject(new Error('ポート 3333 が使用中またはアクセス拒否されました。ファイアウォール設定を確認してください。'))
      } else {
        reject(err)
      }
    })

    server.listen(3333, () => {
      shell.openExternal(authUrl)
    })
  })
}

// [P1-15] Google Drive ファイル型
interface GoogleDriveFile {
  id: string | null | undefined
  name: string | null | undefined
  mimeType: string | null | undefined
  modifiedTime?: string | null | undefined
}

// [P1-15] Google Drive ファイルメタデータ型
interface DriveFileMetadata {
  name: string
  mimeType: string
  parents?: string[]
}

export function setupGoogleHandlers() {
  ensureConfigDir()

  ipcMain.handle('google:auth', async () => {
    try {
      loadCredentials()
      if (loadSavedToken()) return { success: true, message: '既存のトークンでログインしました' }
      await authenticateWithBrowser()
      return { success: true, message: 'Google アカウントでログインしました' }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('google:logout', async () => {
    try {
      const tokenPath = getTokenPath()
      if (fs.existsSync(tokenPath)) {
        fs.unlinkSync(tokenPath)
      }
      oauth2Client = null
      return { success: true }
    } catch (err) {
      throw new Error(`ログアウトエラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle('google:getAuthStatus', async () => {
    try {
      loadCredentials()
      const isAuthed = loadSavedToken()
      return { authenticated: isAuthed }
    } catch {
      return { authenticated: false }
    }
  })

  // [P1-01] IPC ハンドラに try-catch 追加
  ipcMain.handle('google:listFiles', async (_event, folderId?: string) => {
    try {
      if (!oauth2Client) throw new Error('未認証です')
      const drive = google.drive({ version: 'v3', auth: oauth2Client })

      let query = "(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet') and trashed=false"
      if (folderId) {
        const validId = validateFolderId(folderId)
        if (validId) query += ` and '${validId}' in parents`
      }

      const res = await drive.files.list({
        q: query,
        fields: 'files(id, name, modifiedTime, mimeType)',
        orderBy: 'name',
        pageSize: 100,
      })

      return res.data.files || []
    } catch (err) {
      throw new Error(`ファイル一覧取得エラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle('google:listFolders', async () => {
    try {
      if (!oauth2Client) throw new Error('未認証です')
      const drive = google.drive({ version: 'v3', auth: oauth2Client })

      const res = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)',
        orderBy: 'name',
        pageSize: 100,
      })

      return res.data.files || []
    } catch (err) {
      throw new Error(`フォルダ一覧取得エラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle('google:downloadDoc', async (_event, fileId: string) => {
    try {
      if (!oauth2Client) throw new Error('未認証です')
      const drive = google.drive({ version: 'v3', auth: oauth2Client })

      const res = await drive.files.export({
        fileId,
        mimeType: 'text/html',
      })

      const rawHtml = res.data as string
      const cleanedHtml = cleanGoogleDocsHtml(rawHtml)

      return {
        markdown: turndown.turndown(cleanedHtml),
        html: rawHtml,
      }
    } catch (err) {
      throw new Error(`ドキュメントダウンロードエラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle('google:downloadSheet', async (_event, fileId: string) => {
    try {
      if (!oauth2Client) throw new Error('未認証です')
      const drive = google.drive({ version: 'v3', auth: oauth2Client })

      const res = await drive.files.export({
        fileId,
        mimeType: 'text/csv',
      })

      const csv = res.data as string
      return {
        markdown: csvToMarkdownTable(csv),
      }
    } catch (err) {
      throw new Error(`スプレッドシートダウンロードエラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle('google:scanFolder', async (_event, folderId: string) => {
    try {
      if (!oauth2Client) throw new Error('未認証です')
      const drive = google.drive({ version: 'v3', auth: oauth2Client })

      const res = await drive.files.list({
        q: `'${validateFolderId(folderId)}' in parents and (mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet') and trashed=false`,
        fields: 'files(id, name, modifiedTime, mimeType)',
        orderBy: 'name',
      })

      const files = (res.data.files || []) as GoogleDriveFile[]
      const slots: Record<string, Array<Record<string, unknown>>> = { '起': [], '承': [], '転': [], '結': [], 'unclassified': [] }

      for (const file of files) {
        const name = (file.name || '').toLowerCase()
        let slot: string | null = null
        if (name.includes('起') || name.includes('intro') || name.includes('opening')) slot = '起'
        else if (name.includes('承') || name.includes('body') || name.includes('main')) slot = '承'
        else if (name.includes('転') || name.includes('twist') || name.includes('turn')) slot = '転'
        else if (name.includes('結') || name.includes('conclusion') || name.includes('ending')) slot = '結'

        const isSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet'

        const fileData = {
          id: file.id,
          name: file.name,
          path: isSheet ? `gsheet://${file.id}` : `gdoc://${file.id}`,
          extension: isSheet ? '.gsheet' : '.gdoc',
          lastModified: new Date(file.modifiedTime || '').getTime(),
          isGoogleDoc: !isSheet,
          isGoogleSheet: isSheet,
          mimeType: file.mimeType,
        }

        slots[slot || 'unclassified'].push(fileData)
      }

      return slots
    } catch (err) {
      throw new Error(`フォルダスキャンエラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })

  ipcMain.handle('google:saveFile', async (_event, content: string, fileName: string, folderId: string) => {
    try {
      if (!oauth2Client) throw new Error('未認証です')
      const drive = google.drive({ version: 'v3', auth: oauth2Client })

      const fileMetadata: DriveFileMetadata = {
        name: fileName.endsWith('.md') ? fileName : `${fileName}.md`,
        mimeType: 'text/markdown',
      }
      if (folderId) {
        const validId = validateFolderId(folderId)
        if (validId) fileMetadata.parents = [validId]
      }

      const stream = new Readable()
      stream.push(content)
      stream.push(null)

      const res = await drive.files.create({
        requestBody: fileMetadata,
        media: { mimeType: 'text/markdown', body: stream },
        fields: 'id, webViewLink',
      })

      return {
        id: res.data.id,
        url: res.data.webViewLink,
      }
    } catch (err) {
      throw new Error(`Google Drive 保存エラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  })
}
