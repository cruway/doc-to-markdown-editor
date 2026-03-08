import { app, BrowserWindow } from 'electron'
import path from 'path'
import { setupFileHandlers } from './services/fileService'
import { setupConverterHandlers } from './services/converter'
import { setupGoogleHandlers } from './services/googleService'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    ...(process.platform === 'darwin' ? {
      titleBarStyle: 'hiddenInset' as const,
      trafficLightPosition: { x: 20, y: 20 },
    } : {
      autoHideMenuBar: true,
    }),
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// [P1-02] app.whenReady() にエラーハンドリング追加
app.whenReady().then(() => {
  createWindow()
  setupFileHandlers()
  setupConverterHandlers()
  setupGoogleHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}).catch((err) => {
  console.error('アプリケーション初期化エラー:', err)
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
