import { useEditorStore } from '../stores/editorStore'

export function ActionBar() {
  const {
    slots, outputFileName, outputFolderPath, mergedMarkdown,
    isGoogleAuthenticated, isMerging, isSaving,
    setMergedMarkdown, setIsMerging, setIsSaving,
    setGoogleAuthenticated,
  } = useEditorStore()

  const handleMerge = async () => {
    const hasFiles = slots.some(s => s.files.length > 0)
    if (!hasFiles) return

    setIsMerging(true)
    try {
      // Separate Google Docs and local files
      const slotsForLocal = slots.map(slot => ({
        ...slot,
        files: slot.files.filter(f => !f.isGoogleDoc),
      }))

      const sections: string[] = []

      for (const slot of slots) {
        const parts: string[] = []

        for (const file of slot.files) {
          if (file.isGoogleDoc && file.id) {
            const result = await window.electronAPI.googleDownloadDoc(file.id)
            parts.push(result.markdown)
          } else {
            const md = await window.electronAPI.convertToMarkdown(file.path)
            parts.push(md)
          }
        }

        if (parts.length > 0) {
          sections.push(parts.join('\n\n'))
        }
      }

      setMergedMarkdown(sections.join('\n\n---\n\n'))
    } catch (err: any) {
      console.error('Merge failed:', err)
      alert(`統合エラー: ${err.message}`)
    } finally {
      setIsMerging(false)
    }
  }

  const handleSaveLocal = async () => {
    if (!mergedMarkdown) return
    setIsSaving(true)
    try {
      if (outputFolderPath) {
        const filePath = `${outputFolderPath}/${outputFileName}`
        await window.electronAPI.saveToPath(mergedMarkdown, filePath)
        alert(`保存しました: ${filePath}`)
      } else {
        const result = await window.electronAPI.saveFile(mergedMarkdown, outputFileName)
        if (result) alert(`保存しました: ${result}`)
      }
    } catch (err: any) {
      alert(`保存エラー: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveGoogle = async () => {
    if (!mergedMarkdown) return
    if (!isGoogleAuthenticated) {
      const result = await window.electronAPI.googleAuth()
      if (!result.success) {
        alert(result.message)
        return
      }
      setGoogleAuthenticated(true)
    }

    setIsSaving(true)
    try {
      const folders = await window.electronAPI.googleListFolders()
      // For now, save to root. Could show folder picker in future.
      const result = await window.electronAPI.googleSaveFile(
        mergedMarkdown,
        outputFileName,
        '' // root folder
      )
      alert(`Google ドライブに保存しました: ${result.url || result.id}`)
    } catch (err: any) {
      alert(`Google ドライブ保存エラー: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const hasFiles = slots.some(s => s.files.length > 0)

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={handleMerge}
        disabled={!hasFiles || isMerging}
        className="h-12 px-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-mono text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isMerging ? '統合中...' : '統合実行（プレビュー）'}
      </button>
      <button
        onClick={handleSaveLocal}
        disabled={!mergedMarkdown || isSaving}
        className="h-12 px-6 rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)] font-mono text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isSaving ? '保存中...' : 'ローカルに保存'}
      </button>
      <button
        onClick={handleSaveGoogle}
        disabled={!mergedMarkdown || isSaving}
        className="h-12 px-6 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] font-mono text-sm font-medium hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Google ドライブへ保存
      </button>
    </div>
  )
}
