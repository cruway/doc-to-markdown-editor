export interface LocalFile {
  path: string
  name: string
  extension: string
  size?: number
  lastModified?: number
  id?: string          // Google Drive file ID
  isGoogleDoc?: boolean
  isGoogleSheet?: boolean
  mimeType?: string
}

export type SlotType = '起' | '承' | '転' | '結'

export interface SlotConfig {
  type: SlotType
  label: string
  color: string
  files: LocalFile[]
}

export type SeparatorType = 'hr' | 'heading' | 'none'

export type MenuId = 'editor' | 'files' | 'settings'

export interface MergeOptions {
  separator: SeparatorType
  extractImages: boolean
  imageOutputDir?: string
}

// [P1-15] Google API 型定義
export interface GoogleDriveFolder {
  id: string
  name: string
}

export interface GoogleDriveFileInfo {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
}

export interface ElectronAPI {
  scanFolder: (folderPath: string) => Promise<Record<string, LocalFile[]>>
  openFolder: () => Promise<string | null>
  openFiles: (extensions: string[]) => Promise<LocalFile[]>
  saveFile: (content: string, defaultName: string) => Promise<string | null>
  saveToPath: (content: string, filePath: string) => Promise<string>
  convertToMarkdown: (filePath: string) => Promise<string>
  mergeDocuments: (slots: SlotConfig[], options?: MergeOptions) => Promise<string>
  extractImages: (markdown: string, outputDir: string) => Promise<{ markdown: string; imageCount: number }>
  googleAuth: () => Promise<{ success: boolean; message: string }>
  googleLogout: () => Promise<{ success: boolean }>
  googleGetAuthStatus: () => Promise<{ authenticated: boolean }>
  googleListFiles: (folderId?: string) => Promise<GoogleDriveFileInfo[]>
  googleListFolders: () => Promise<GoogleDriveFolder[]>
  googleBrowseFolderContents: (folderId?: string) => Promise<{ folders: GoogleDriveFolder[]; files: GoogleDriveFileInfo[] }>
  googleDownloadDoc: (fileId: string) => Promise<{ markdown: string; html: string }>
  googleDownloadSheet: (fileId: string) => Promise<{ markdown: string }>
  googleScanFolder: (folderId: string) => Promise<Record<string, LocalFile[]>>
  googleSaveFile: (content: string, fileName: string, folderId: string) => Promise<{ id: string; url: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
