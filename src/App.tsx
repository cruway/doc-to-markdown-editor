import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { SlotPanel } from './components/SlotPanel'
import { FileOperations } from './components/FileOperations'
import { MarkdownEditor } from './components/MarkdownEditor'
import { ActionBar } from './components/ActionBar'
import { useEditorStore } from './stores/editorStore'

export default function App() {
  const { setGoogleAuthenticated } = useEditorStore()

  useEffect(() => {
    // Check Google auth status on mount
    window.electronAPI?.googleGetAuthStatus?.().then((status) => {
      if (status?.authenticated) {
        setGoogleAuthenticated(true)
      }
    }).catch((err) => {
      // [F-002] 認証状態チェック失敗時にログ出力
      console.warn('Google 認証状態チェック失敗:', err)
    })
  }, [setGoogleAuthenticated])

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />
      <main className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
        <Header />
        <SlotPanel />
        <FileOperations />
        <MarkdownEditor />
        <ActionBar />
      </main>
    </div>
  )
}
