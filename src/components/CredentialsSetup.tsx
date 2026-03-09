import { useState, useRef } from 'react'

interface Props {
  onComplete: () => void
}

export function CredentialsSetup({ onComplete }: Props) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      setJsonText(text)
      setError('')
    } catch {
      setError('ファイルの読み込みに失敗しました')
    }
  }

  const handleSave = async () => {
    if (!jsonText.trim()) {
      setError('JSON を入力またはファイルを選択してください')
      return
    }

    try {
      JSON.parse(jsonText)
    } catch {
      setError('JSON の形式が正しくありません')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const result = await window.electronAPI.googleSaveCredentials(jsonText)
      if (result.success) {
        setSuccess(result.message)
        setTimeout(() => onComplete(), 800)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    try {
      const text = await file.text()
      setJsonText(text)
      setError('')
    } catch {
      setError('ファイルの読み込みに失敗しました')
    }
  }

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[520px] flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <span className="material-symbols-sharp text-white text-[20px]" style={{ fontVariationSettings: "'wght' 300" }}>key</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold font-mono text-[var(--foreground)]">Google OAuth 設定</h1>
                <p className="text-sm text-[var(--muted-foreground)] font-sans">credentials.json を設定してください</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)] p-4">
            <p className="text-xs font-semibold font-mono text-[var(--foreground)] mb-2">セットアップ手順</p>
            <ol className="text-xs text-[var(--muted-foreground)] font-sans space-y-1 list-decimal list-inside">
              <li>Google Cloud Console でプロジェクトを作成</li>
              <li>OAuth 2.0 クライアント ID を作成（デスクトップアプリ）</li>
              <li>credentials.json をダウンロード</li>
              <li>以下にファイルを配置またはJSONを貼り付け</li>
            </ol>
          </div>

          {/* File drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
          >
            <span className="material-symbols-sharp text-[32px] text-[var(--muted-foreground)] block mb-2" style={{ fontVariationSettings: "'wght' 200" }}>upload_file</span>
            <p className="text-sm text-[var(--muted-foreground)] font-sans">
              credentials.json をドラッグ＆ドロップ
            </p>
            <p className="text-xs text-[var(--muted-foreground)] font-sans mt-1">
              またはクリックしてファイルを選択
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* JSON textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono font-medium text-[var(--foreground)]">
              または JSON を直接貼り付け
            </label>
            <textarea
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setError('') }}
              placeholder='{"installed":{"client_id":"...","client_secret":"...","redirect_uris":["..."]}}'
              rows={6}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="material-symbols-sharp text-[16px] text-red-400" style={{ fontVariationSettings: "'wght' 300" }}>error</span>
              <p className="text-xs text-red-400 font-sans">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="material-symbols-sharp text-[16px] text-emerald-400" style={{ fontVariationSettings: "'wght' 300" }}>check_circle</span>
              <p className="text-xs text-emerald-400 font-sans">{success}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !jsonText.trim()}
              className="flex-1 h-10 rounded-full bg-[var(--primary)] text-white text-sm font-mono font-medium shadow-sm hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSaving ? '保存中...' : '保存して続行'}
            </button>
            <button
              onClick={onComplete}
              className="h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--background)] text-sm font-mono font-medium text-[var(--muted-foreground)] shadow-sm hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all duration-200"
            >
              スキップ
            </button>
          </div>

          <p className="text-[11px] text-[var(--muted-foreground)] font-sans text-center">
            Google ドライブ連携なしでもローカルファイルの変換は利用できます
          </p>
        </div>
      </div>
    </div>
  )
}
