export interface LocalFile {
  path: string
  name: string
  extension: string
  size?: number
  lastModified?: number
  id?: string          // Google Drive file ID
  isGoogleDoc?: boolean
}

export type SlotType = '起' | '承' | '転' | '結'

export interface SlotConfig {
  type: SlotType
  label: string
  color: string
  files: LocalFile[]
}

export interface EditorState {
  slots: SlotConfig[]
  mergedMarkdown: string
  outputFileName: string
  outputFolderPath: string
  isGoogleAuthenticated: boolean
}

export interface ElectronAPI {
  scanFolder: (folderPath: string) => Promise<Record<string, LocalFile[]>>
  openFolder: () => Promise<string | null>
  openFiles: (extensions: string[]) => Promise<LocalFile[]>
  saveFile: (content: string, defaultName: string) => Promise<string | null>
  saveToPath: (content: string, filePath: string) => Promise<string>
  convertToMarkdown: (filePath: string) => Promise<string>
  mergeDocuments: (slots: SlotConfig[]) => Promise<string>
  googleAuth: () => Promise<{ success: boolean; message: string }>
  googleLogout: () => Promise<{ success: boolean }>
  googleGetAuthStatus: () => Promise<{ authenticated: boolean }>
  googleListFiles: (folderId?: string) => Promise<any[]>
  googleListFolders: () => Promise<any[]>
  googleDownloadDoc: (fileId: string) => Promise<{ markdown: string; html: string }>
  googleScanFolder: (folderId: string) => Promise<Record<string, LocalFile[]>>
  googleSaveFile: (content: string, fileName: string, folderId: string) => Promise<{ id: string; url: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
