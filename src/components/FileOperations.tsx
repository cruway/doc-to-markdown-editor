import { useEditorStore } from '../stores/editorStore'

// Windows 予約名
const RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i

function sanitizeFileName(value: string): string {
  let sanitized = value
    .replace(/[/\\:*?"<>|]/g, '_')  // 不正文字を置換
    .trim()                          // 前後の空白を除去
    .slice(0, 255)                   // 最大長制限
  // Windows 予約名チェック
  const nameWithoutExt = sanitized.replace(/\.[^.]+$/, '')
  if (RESERVED_NAMES.test(nameWithoutExt)) {
    sanitized = `_${sanitized}`
  }
  return sanitized || 'output_document.md'
}

export function FileOperations() {
  const { outputFileName, outputFolderPath, setOutputFileName, setOutputFolderPath } = useEditorStore()

  const handleSelectFolder = async () => {
    const folder = await window.electronAPI.openFolder()
    if (folder) setOutputFolderPath(folder)
  }

  return (
    <section className="flex items-end gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <label htmlFor="output-filename" className="text-sm font-medium text-[var(--foreground)] font-sans">
          出力ファイル名
        </label>
        <input
          id="output-filename"
          type="text"
          value={outputFileName}
          onChange={(e) => setOutputFileName(sanitizeFileName(e.target.value))}
          className="w-full h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] font-sans placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/25 focus:border-[var(--ring)] transition-all duration-200"
          placeholder="output_document.md"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--foreground)] font-sans">
          保存先フォルダ
        </label>
        <button
          onClick={handleSelectFolder}
          className="w-full h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm text-left font-sans truncate hover:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/25 focus:border-[var(--ring)] transition-all duration-200"
        >
          <span className={outputFolderPath ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}>
            {outputFolderPath || 'フォルダを選択...'}
          </span>
        </button>
      </div>
    </section>
  )
}
