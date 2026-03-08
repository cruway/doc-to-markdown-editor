import { useEditorStore } from '../stores/editorStore'
import type { SeparatorType } from '../types'

const SEPARATOR_OPTIONS: { value: SeparatorType; label: string }[] = [
  { value: 'hr', label: '水平線（---）' },
  { value: 'heading', label: '見出し（## 起/承/転/結）' },
  { value: 'none', label: 'なし' },
]

export function ActionBar() {
  const {
    slots, outputFileName, outputFolderPath, mergedMarkdown,
    isGoogleAuthenticated, isMerging, isSaving,
    separator, extractImages,
    setMergedMarkdown, setIsMerging, setIsSaving,
    setGoogleAuthenticated, setSeparator, setExtractImages,
  } = useEditorStore()

  const handleMerge = async () => {
    const hasFiles = slots.some(s => s.files.length > 0)
    if (!hasFiles) return

    setIsMerging(true)
    try {
      const sections: string[] = []

      for (const slot of slots) {
        const parts: string[] = []

        for (const file of slot.files) {
          if (file.isGoogleSheet && file.id) {
            const result = await window.electronAPI.googleDownloadSheet(file.id)
            parts.push(result.markdown)
          } else if (file.isGoogleDoc && file.id) {
            const result = await window.electronAPI.googleDownloadDoc(file.id)
            parts.push(result.markdown)
          } else {
            const md = await window.electronAPI.convertToMarkdown(file.path)
            parts.push(md)
          }
        }

        if (parts.length > 0) {
          const sectionContent = parts.join('\n\n')
          if (separator === 'heading') {
            sections.push(`## ${slot.type}\n\n${sectionContent}`)
          } else {
            sections.push(sectionContent)
          }
        }
      }

      const joinSeparator = separator === 'heading' ? '\n\n' : separator === 'none' ? '\n\n' : '\n\n---\n\n'
      let merged = sections.join(joinSeparator)

      // [H-04] 画像抽出が有効だがフォルダ未指定の場合は警告
      if (extractImages && !outputFolderPath) {
        alert('画像を抽出するには、保存先フォルダを指定してください。')
      } else if (extractImages && outputFolderPath) {
        const result = await window.electronAPI.extractImages(merged, outputFolderPath)
        merged = result.markdown
        if (result.imageCount > 0) {
          console.log(`${result.imageCount} 個の画像を抽出しました`)
        }
      }

      setMergedMarkdown(merged)
    } catch (err) {
      // [P1-09] err 型安全化
      const message = err instanceof Error ? err.message : String(err)
      console.error('Merge failed:', err)
      alert(`統合エラー: ${message}`)
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      alert(`保存エラー: ${message}`)
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
      const result = await window.electronAPI.googleSaveFile(
        mergedMarkdown,
        outputFileName,
        ''
      )
      alert(`Google ドライブに保存しました: ${result.url || result.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      alert(`Google ドライブ保存エラー: ${message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const hasFiles = slots.some(s => s.files.length > 0)

  return (
    <div className="flex flex-col gap-3">
      {/* Merge options */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[var(--muted-foreground)] font-sans whitespace-nowrap">
            区切り
          </label>
          <select
            value={separator}
            onChange={(e) => setSeparator(e.target.value as SeparatorType)}
            className="h-8 px-3 rounded-full border border-[var(--input)] bg-[var(--background)] text-xs text-[var(--foreground)] font-sans focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            {SEPARATOR_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] font-sans cursor-pointer">
          <input
            type="checkbox"
            checked={extractImages}
            onChange={(e) => setExtractImages(e.target.checked)}
            className="rounded border-[var(--input)] accent-[var(--primary)]"
          />
          画像を外部ファイルに抽出
        </label>
      </div>

      {/* Action buttons */}
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
    </div>
  )
}
