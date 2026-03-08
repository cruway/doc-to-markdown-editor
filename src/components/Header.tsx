import { useEditorStore } from '../stores/editorStore'

export function Header() {
  const { slots, setGoogleAuthenticated, isGoogleAuthenticated } = useEditorStore()
  const store = useEditorStore.getState()

  const handleScanLocalFolder = async () => {
    const folder = await window.electronAPI.openFolder()
    if (!folder) return

    const result = await window.electronAPI.scanFolder(folder)

    // Populate slots with classified files
    const newSlots = store.slots.map(slot => ({
      ...slot,
      files: [...slot.files, ...(result[slot.type] || [])],
    }))
    store.setSlots(newSlots)
    store.setOutputFolderPath(folder)
  }

  const handleGoogleConnect = async () => {
    if (isGoogleAuthenticated) return

    const result = await window.electronAPI.googleAuth()
    if (result.success) {
      setGoogleAuthenticated(true)
    } else {
      alert(result.message)
    }
  }

  const handleGoogleScan = async () => {
    if (!isGoogleAuthenticated) {
      await handleGoogleConnect()
      if (!useEditorStore.getState().isGoogleAuthenticated) return
    }

    const folders = await window.electronAPI.googleListFolders()
    // Simple: scan all Google Docs (no folder selection for now, could add picker)
    if (folders.length > 0) {
      // Ask user to pick a folder would be ideal, for now use first folder or root
      const result = await window.electronAPI.googleScanFolder(folders[0]?.id || '')
      const newSlots = useEditorStore.getState().slots.map(slot => ({
        ...slot,
        files: [...slot.files, ...(result[slot.type] || [])],
      }))
      useEditorStore.getState().setSlots(newSlots)
    }
  }

  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold font-mono text-[var(--foreground)]">
          Doc-to-Markdown 統合エディタ
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] font-sans mt-1">
          ドキュメントを起承転結の構成で統合し、マークダウンに変換
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleScanLocalFolder}
          className="h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm font-mono text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors shadow-sm"
        >
          ローカルフォルダを取得
        </button>
        <button
          onClick={handleGoogleScan}
          className="h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm font-mono text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors shadow-sm"
        >
          Google ドライブから取得
        </button>
      </div>
    </header>
  )
}
