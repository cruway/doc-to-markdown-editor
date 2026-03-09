import { contextBridge, ipcRenderer } from 'electron'

// [P1-15] preload の型定義は src/types/index.ts の ElectronAPI と対応
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  scanFolder: (folderPath: string) => ipcRenderer.invoke('file:scanFolder', folderPath),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFiles: (extensions: string[]) => ipcRenderer.invoke('dialog:openFiles', extensions),
  saveFile: (content: string, defaultName: string) => ipcRenderer.invoke('dialog:saveFile', content, defaultName),
  saveToPath: (content: string, filePath: string) => ipcRenderer.invoke('file:saveToPath', content, filePath),

  // Conversion
  convertToMarkdown: (filePath: string) => ipcRenderer.invoke('file:convertToMarkdown', filePath),
  mergeDocuments: (slots: Record<string, unknown>[], options?: Record<string, unknown>) =>
    ipcRenderer.invoke('file:mergeDocuments', slots, options),
  extractImages: (markdown: string, outputDir: string) => ipcRenderer.invoke('file:extractImages', markdown, outputDir),

  // Google Credentials
  googleGetCredentialsStatus: () => ipcRenderer.invoke('google:getCredentialsStatus'),
  googleSaveCredentials: (jsonContent: string) => ipcRenderer.invoke('google:saveCredentials', jsonContent),
  googleDeleteCredentials: () => ipcRenderer.invoke('google:deleteCredentials'),

  // Google Workspace
  googleAuth: () => ipcRenderer.invoke('google:auth'),
  googleLogout: () => ipcRenderer.invoke('google:logout'),
  googleGetAuthStatus: () => ipcRenderer.invoke('google:getAuthStatus'),
  googleListFiles: (folderId?: string) => ipcRenderer.invoke('google:listFiles', folderId),
  googleListFolders: () => ipcRenderer.invoke('google:listFolders'),
  googleBrowseFolderContents: (folderId?: string) => ipcRenderer.invoke('google:browseFolderContents', folderId),
  googleDownloadDoc: (fileId: string) => ipcRenderer.invoke('google:downloadDoc', fileId),
  googleDownloadSheet: (fileId: string) => ipcRenderer.invoke('google:downloadSheet', fileId),
  googleScanFolder: (folderId: string) => ipcRenderer.invoke('google:scanFolder', folderId),
  googleSaveFile: (content: string, fileName: string, folderId: string) =>
    ipcRenderer.invoke('google:saveFile', content, fileName, folderId),
})
