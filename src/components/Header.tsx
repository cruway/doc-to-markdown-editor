import { useState } from 'react'
import { useEditorStore } from '../stores/editorStore'
import type { GoogleDriveFolder, GoogleDriveFileInfo } from '../types'

interface BreadcrumbItem {
  id: string | undefined
  name: string
}

interface HeaderProps {
  onCredentialsMissing: () => void
}

export function Header({ onCredentialsMissing }: HeaderProps) {
  const {
    slots, setSlots, setOutputFolderPath,
    isGoogleAuthenticated, setGoogleAuthenticated,
    isScanning, setIsScanning,
    showDriveBrowser, setShowDriveBrowser,
  } = useEditorStore()
  const [driveFolders, setDriveFolders] = useState<GoogleDriveFolder[]>([])
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFileInfo[]>([])
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([])
  const [isLoadingContents, setIsLoadingContents] = useState(false)

  // [P1-11] スキャン中はボタンを無効化
  const handleScanLocalFolder = async () => {
    setIsScanning(true)
    try {
      const folder = await window.electronAPI.openFolder()
      if (!folder) return

      const result = await window.electronAPI.scanFolder(folder)

      const currentSlots = useEditorStore.getState().slots
      const newSlots = currentSlots.map(slot => ({
        ...slot,
        files: [...slot.files, ...(result[slot.type] || [])],
      }))
      setSlots(newSlots)
      setOutputFolderPath(folder)
    } catch (err) {
      alert(`スキャンエラー: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsScanning(false)
    }
  }

  const handleGoogleConnect = async (): Promise<boolean> => {
    if (isGoogleAuthenticated) return true

    // credentials.json の存在チェック
    const credStatus = await window.electronAPI.googleGetCredentialsStatus()
    if (!credStatus.exists || !credStatus.valid) {
      onCredentialsMissing()
      return false
    }

    const result = await window.electronAPI.googleAuth()
    if (result.success) {
      setGoogleAuthenticated(true)
      return true
    } else {
      alert(result.message)
      return false
    }
  }

  const loadFolderContents = async (folderId?: string) => {
    setIsLoadingContents(true)
    try {
      const contents = await window.electronAPI.googleBrowseFolderContents(folderId)
      setDriveFolders(contents.folders)
      setDriveFiles(contents.files)
    } catch (err) {
      alert(`フォルダ内容取得エラー: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoadingContents(false)
    }
  }

  const handleOpenDriveBrowser = async () => {
    try {
      const authed = await handleGoogleConnect()
      if (!authed) return

      setBreadcrumb([{ id: undefined, name: 'マイドライブ' }])
      await loadFolderContents(undefined)
      setShowDriveBrowser(true)
    } catch (err) {
      alert(`Google スキャンエラー: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleNavigateToFolder = async (folder: GoogleDriveFolder) => {
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }])
    await loadFolderContents(folder.id)
  }

  const handleBreadcrumbClick = async (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1)
    setBreadcrumb(newBreadcrumb)
    await loadFolderContents(newBreadcrumb[newBreadcrumb.length - 1].id)
  }

  const handleCloseDriveBrowser = () => {
    setShowDriveBrowser(false)
    setDriveFolders([])
    setDriveFiles([])
    setBreadcrumb([])
  }

  const handleFileDragStart = (e: React.DragEvent, file: GoogleDriveFileInfo) => {
    const isSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet'
    const localFile = {
      id: file.id,
      name: file.name,
      path: isSheet ? `gsheet://${file.id}` : `gdoc://${file.id}`,
      extension: isSheet ? '.gsheet' : '.gdoc',
      lastModified: file.modifiedTime ? new Date(file.modifiedTime).getTime() : 0,
      isGoogleDoc: !isSheet,
      isGoogleSheet: isSheet,
      mimeType: file.mimeType,
    }
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ file: localFile, fromSlot: 'google-drive' })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <>
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold font-mono text-[var(--foreground)]">
            Doc-to-Markdown 統合エディタ
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] font-sans">
            Google ドキュメントを起承転結の構成で統合し、マークダウンに変換
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleScanLocalFolder}
            disabled={isScanning}
            className="no-drag h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm font-mono font-medium text-[var(--foreground)] shadow-sm hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-sharp text-[16px]" style={{ fontVariationSettings: "'wght' 300" }}>folder_open</span>
              {isScanning ? 'スキャン中...' : 'ローカル取得'}
            </span>
          </button>
          <button
            onClick={handleOpenDriveBrowser}
            disabled={isScanning}
            className="no-drag h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm font-mono font-medium text-[var(--foreground)] shadow-sm hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-sharp text-[16px]" style={{ fontVariationSettings: "'wght' 300" }}>cloud_download</span>
              {isScanning ? 'スキャン中...' : 'Google ドライブから取得'}
            </span>
          </button>
        </div>
      </header>

      {showDriveBrowser && (
        <div className="fixed top-0 right-0 z-50 h-full w-[320px] flex flex-col bg-[var(--background)] border-l border-[var(--border)] shadow-2xl">
          {/* Drag region */}
          <div className="drag-region h-[52px] flex-shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold font-mono text-[var(--foreground)]">Google ドライブ</h2>
            <button
              onClick={handleCloseDriveBrowser}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <span className="material-symbols-sharp text-[18px]">close</span>
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border)] overflow-x-auto">
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center gap-1 flex-shrink-0">
                {index > 0 && <span className="text-[var(--muted-foreground)] text-xs">/</span>}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`text-xs font-mono px-1.5 py-0.5 rounded hover:bg-[var(--accent)] transition-colors ${
                    index === breadcrumb.length - 1
                      ? 'text-[var(--foreground)] font-semibold'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  {item.name}
                </button>
              </span>
            ))}
          </div>

          {/* Contents */}
          <div className="overflow-y-auto flex-1 p-2">
            {isLoadingContents ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-[var(--muted-foreground)] font-sans">読み込み中...</span>
              </div>
            ) : driveFolders.length === 0 && driveFiles.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-[var(--muted-foreground)] font-sans">このフォルダは空です</span>
              </div>
            ) : (
              <>
                {/* Folders */}
                {driveFolders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleNavigateToFolder(folder)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-mono text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-sharp text-[16px] text-amber-500" style={{ fontVariationSettings: "'wght' 300" }}>folder</span>
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}

                {/* Divider */}
                {driveFolders.length > 0 && driveFiles.length > 0 && (
                  <div className="border-t border-[var(--border)] my-1" />
                )}

                {/* Files (draggable) */}
                {driveFiles.map(file => (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleFileDragStart(e, file)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-mono text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)]" style={{ fontVariationSettings: "'wght' 300" }}>
                      {file.mimeType === 'application/vnd.google-apps.spreadsheet' ? 'table_chart' : 'description'}
                    </span>
                    <span className="truncate">{file.name}</span>
                    <span className="material-symbols-sharp text-[12px] text-[var(--muted-foreground)] ml-auto flex-shrink-0" style={{ fontVariationSettings: "'wght' 200" }}>drag_indicator</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-3 border-t border-[var(--border)]">
            <p className="text-[11px] text-[var(--muted-foreground)] font-sans">
              ファイルを左のスロットにドラッグ＆ドロップ
            </p>
          </div>
        </div>
      )}
    </>
  )
}
