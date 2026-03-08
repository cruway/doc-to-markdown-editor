import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  scanFolder: (folderPath: string) => ipcRenderer.invoke('file:scanFolder', folderPath),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFiles: (extensions: string[]) => ipcRenderer.invoke('dialog:openFiles', extensions),
  saveFile: (content: string, defaultName: string) => ipcRenderer.invoke('dialog:saveFile', content, defaultName),
  saveToPath: (content: string, filePath: string) => ipcRenderer.invoke('file:saveToPath', content, filePath),

  // Conversion
  convertToMarkdown: (filePath: string) => ipcRenderer.invoke('file:convertToMarkdown', filePath),
  mergeDocuments: (slots: any[]) => ipcRenderer.invoke('file:mergeDocuments', slots),

  // Google Workspace
  googleAuth: () => ipcRenderer.invoke('google:auth'),
  googleLogout: () => ipcRenderer.invoke('google:logout'),
  googleGetAuthStatus: () => ipcRenderer.invoke('google:getAuthStatus'),
  googleListFiles: (folderId?: string) => ipcRenderer.invoke('google:listFiles', folderId),
  googleListFolders: () => ipcRenderer.invoke('google:listFolders'),
  googleDownloadDoc: (fileId: string) => ipcRenderer.invoke('google:downloadDoc', fileId),
  googleScanFolder: (folderId: string) => ipcRenderer.invoke('google:scanFolder', folderId),
  googleSaveFile: (content: string, fileName: string, folderId: string) =>
    ipcRenderer.invoke('google:saveFile', content, fileName, folderId),
})
