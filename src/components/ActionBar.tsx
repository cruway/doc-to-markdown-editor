import { useEditorStore } from '../stores/editorStore'

export function ActionBar() {
  const {
    slots, outputFileName, outputFolderPath, mergedMarkdown,
    isGoogleAuthenticated, isMerging, isSaving,
    separator, extractImages,
    setMergedMarkdown, setIsMerging, setIsSaving,
    setGoogleAuthenticated,
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

      // separator ロジック修正: 'hr' → '---', 'heading'/'none' → 改行のみ
      const joinSeparator = separator === 'hr' ? '\n\n---\n\n' : '\n\n'
      let merged = sections.join(joinSeparator)

      // 画像抽出が有効だがフォルダ未指定の場合は中断
      if (extractImages && !outputFolderPath) {
        alert('画像を抽出するには、保存先フォルダを指定してください。')
        setMergedMarkdown(merged)
        return
      }
      if (extractImages && outputFolderPath) {
        const result = await window.electronAPI.extractImages(merged, outputFolderPath)
        merged = result.markdown
        if (result.imageCount > 0) {
          console.log(`${result.imageCount} 個の画像を抽出しました`)
        }
      }

      setMergedMarkdown(merged)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Merge failed:', err)
      alert(`統合エラー: ${message}`)
    } finally {
      setIsMerging(false)
    }
  }

  // .md 拡張子を保証
  const ensureMdExtension = (name: string) => name.endsWith('.md') ? name : `${name}.md`

  const handleSaveLocal = async () => {
    if (!mergedMarkdown) return
    setIsSaving(true)
    try {
      const filename = ensureMdExtension(outputFileName)
      if (outputFolderPath) {
        const filePath = `${outputFolderPath}/${filename}`
        await window.electronAPI.saveToPath(mergedMarkdown, filePath)
        alert(`保存しました: ${filePath}`)
      } else {
        const result = await window.electronAPI.saveFile(mergedMarkdown, filename)
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
      const filename = ensureMdExtension(outputFileName)
      const result = await window.electronAPI.googleSaveFile(
        mergedMarkdown,
        filename,
        ''
      )
      const location = result?.url || result?.id || 'unknown'
      alert(`Google ドライブに保存しました: ${location}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      alert(`Google ドライブ保存エラー: ${message}`)
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
        className="h-12 px-6 rounded-full bg-[var(--primary)] text-sm font-mono font-medium text-[var(--foreground)] hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isMerging ? '統合中...' : '統合実行（プレビュー）'}
      </button>
      <button
        onClick={handleSaveGoogle}
        disabled={!mergedMarkdown || isSaving}
        className="h-12 px-6 rounded-full bg-[#E7E8E5] text-sm font-mono font-medium text-[var(--foreground)] hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        Google ドライブへ保存
      </button>
    </div>
  )
}
