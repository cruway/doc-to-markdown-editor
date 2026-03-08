import { useEditorStore } from '../stores/editorStore'

export function FileOperations() {
  const { outputFileName, outputFolderPath, setOutputFileName, setOutputFolderPath } = useEditorStore()

  const handleSelectFolder = async () => {
    const folder = await window.electronAPI.openFolder()
    if (folder) setOutputFolderPath(folder)
  }

  return (
    <section className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-[var(--foreground)] font-sans mb-1.5">
          出力ファイル名
        </label>
        <input
          type="text"
          value={outputFileName}
          onChange={(e) => setOutputFileName(e.target.value)}
          className="w-full h-10 px-4 rounded-full border border-[var(--input)] bg-[var(--background)] text-sm text-[var(--foreground)] font-sans placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          placeholder="output_document.md"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-[var(--foreground)] font-sans mb-1.5">
          保存先フォルダ
        </label>
        <button
          onClick={handleSelectFolder}
          className="w-full h-10 px-4 rounded-full border border-[var(--input)] bg-[var(--background)] text-sm text-left font-sans truncate hover:border-[var(--ring)] transition-colors"
        >
          <span className={outputFolderPath ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}>
            {outputFolderPath || 'フォルダを選択...'}
          </span>
        </button>
      </div>
    </section>
  )
}
