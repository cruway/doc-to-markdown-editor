import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { SlotPanel } from './components/SlotPanel'
import { FileOperations } from './components/FileOperations'
import { MarkdownEditor } from './components/MarkdownEditor'
import { ActionBar } from './components/ActionBar'
import { CredentialsSetup } from './components/CredentialsSetup'
import { useEditorStore } from './stores/editorStore'

export default function App() {
  const { setGoogleAuthenticated, showDriveBrowser } = useEditorStore()
  const [credentialsReady, setCredentialsReady] = useState<boolean | null>(null)
  const [showCredentialsSetup, setShowCredentialsSetup] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const status = await window.electronAPI.googleGetCredentialsStatus()
        if (!cancelled) {
          setCredentialsReady(status.exists && status.valid === true)
        }
        if (status.exists && status.valid) {
          const authStatus = await window.electronAPI.googleGetAuthStatus()
          if (!cancelled && authStatus?.authenticated) {
            setGoogleAuthenticated(true)
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('認証状態チェック失敗:', err)
          setCredentialsReady(false)
        }
      }
    }
    check()
    return () => { cancelled = true }
  }, [setGoogleAuthenticated])

  // 初回チェック中
  if (credentialsReady === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <span className="text-sm text-[var(--muted-foreground)] font-sans">読み込み中...</span>
      </div>
    )
  }

  // credentials 未設定（初回）または設定画面表示中
  if (!credentialsReady || showCredentialsSetup) {
    return (
      <CredentialsSetup
        onComplete={() => {
          setCredentialsReady(true)
          setShowCredentialsSetup(false)
        }}
      />
    )
  }

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />
      <main className={`flex-1 min-w-0 flex flex-col gap-6 px-8 pb-8 overflow-y-auto transition-[margin] duration-300 ${showDriveBrowser ? 'mr-[320px]' : ''}`}>
        {/* Drag region for window title bar */}
        <div className="drag-region h-[52px] flex-shrink-0" />
        <Header onCredentialsMissing={() => setShowCredentialsSetup(true)} />
        <SlotPanel />
        <FileOperations />
        <MarkdownEditor />
        <ActionBar />
      </main>
    </div>
  )
}
