import { useEditorStore } from '../stores/editorStore'
import type { GoogleDriveFolder } from '../types'

export function Header() {
  const {
    slots, setSlots, setOutputFolderPath,
    isGoogleAuthenticated, setGoogleAuthenticated,
    isScanning, setIsScanning,
  } = useEditorStore()

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
      if (!authed) return

      const folders: GoogleDriveFolder[] = await window.electronAPI.googleListFolders()
      if (folders.length === 0) {
        alert('Google ドライブにフォルダがありません')
        return
      }

      const folderNames = folders.map((f, i) => `${i + 1}. ${f.name}`).join('\n')
      const input = window.prompt(
        `スキャンするフォルダを選択してください（番号を入力）:\n${folderNames}`,
        '1'
      )
      if (!input) return

      const idx = parseInt(input.trim(), 10) - 1
      if (isNaN(idx) || idx < 0 || idx >= folders.length) {
        alert('無効な番号です')
        return
      }

      const selectedFolder = folders[idx]
      const result = await window.electronAPI.googleScanFolder(selectedFolder.id)
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

  return (
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
  )
}
