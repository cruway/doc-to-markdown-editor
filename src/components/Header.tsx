import { useEditorStore } from '../stores/editorStore'

export function Header() {
  // [M-03] React hooks 経由で最新の state を取得
  const {
    slots, setSlots, setOutputFolderPath,
    isGoogleAuthenticated, setGoogleAuthenticated,
  } = useEditorStore()

  const handleScanLocalFolder = async () => {
    const folder = await window.electronAPI.openFolder()
    if (!folder) return

    const result = await window.electronAPI.scanFolder(folder)

    // イベントハンドラ内では getState() で最新値を取得
    const currentSlots = useEditorStore.getState().slots
    const newSlots = currentSlots.map(slot => ({
      ...slot,
      files: [...slot.files, ...(result[slot.type] || [])],
    }))
    setSlots(newSlots)
    setOutputFolderPath(folder)
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

  // [M-04] Google Drive フォルダ選択ダイアログ
  const handleGoogleScan = async () => {
    if (!isGoogleAuthenticated) {
      await handleGoogleConnect()
      if (!useEditorStore.getState().isGoogleAuthenticated) return
    }

    const folders = await window.electronAPI.googleListFolders()
    if (folders.length === 0) {
      alert('Google ドライブにフォルダがありません')
      return
    }

    const folderNames = folders.map((f: any, i: number) => `${i + 1}. ${f.name}`).join('\n')
    const input = window.prompt(
      `スキャンするフォルダを選択してください（番号を入力）:\n${folderNames}`,
      '1'
    )
    if (!input) return

    const idx = parseInt(input, 10) - 1
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
