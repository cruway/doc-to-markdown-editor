import { useState } from 'react'
import { useEditorStore } from '../stores/editorStore'
import type { GoogleDriveFolder } from '../types'

export function Header() {
  const {
    slots, setSlots, setOutputFolderPath,
    isGoogleAuthenticated, setGoogleAuthenticated,
    isScanning, setIsScanning,
  } = useEditorStore()

  const [folderList, setFolderList] = useState<GoogleDriveFolder[]>([])
  const [showFolderModal, setShowFolderModal] = useState(false)

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

    const result = await window.electronAPI.googleAuth()
    if (result.success) {
      setGoogleAuthenticated(true)
      return true
    } else {
      alert(result.message)
      return false
    }
  }

  const handleGoogleScan = async () => {
    setIsScanning(true)
    try {
      // [P1-09] handleGoogleConnect の戻り値で認証結果を判定
      const authed = await handleGoogleConnect()
      if (!authed) {
        setIsScanning(false)
        return
      }

      const folders: GoogleDriveFolder[] = await window.electronAPI.googleListFolders()
      if (folders.length === 0) {
        alert('Google ドライブにフォルダがありません')
        setIsScanning(false)
        return
      }

      setFolderList(folders)
      setShowFolderModal(true)
    } catch (err) {
      alert(`Google スキャンエラー: ${err instanceof Error ? err.message : String(err)}`)
      setIsScanning(false)
    }
  }

  const handleFolderSelect = async (folder: GoogleDriveFolder) => {
    setShowFolderModal(false)
    try {
      const result = await window.electronAPI.googleScanFolder(folder.id)
      const currentSlots = useEditorStore.getState().slots
      const newSlots = currentSlots.map(slot => ({
        ...slot,
        files: [...slot.files, ...(result[slot.type] || [])],
      }))
      setSlots(newSlots)
    } catch (err) {
      alert(`Google スキャンエラー: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsScanning(false)
    }
  }

  const handleFolderModalClose = () => {
    setShowFolderModal(false)
    setIsScanning(false)
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
            onClick={handleGoogleScan}
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

      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleFolderModalClose}>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl w-96 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold font-mono text-[var(--foreground)]">フォルダを選択</h2>
              <button
                onClick={handleFolderModalClose}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <span className="material-symbols-sharp text-[18px]">close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {folderList.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-mono text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)]" style={{ fontVariationSettings: "'wght' 300" }}>folder</span>
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
