import { useEditorStore } from '../stores/editorStore'
import type { MenuId } from '../types'

const menuItems: { id: MenuId; label: string; icon: string }[] = [
  { id: 'editor', label: '統合エディタ', icon: 'merge_type' },
  { id: 'files', label: 'ファイル管理', icon: 'folder' },
  { id: 'settings', label: '設定', icon: 'settings' },
]

export function Sidebar() {
  const { activeMenu, setActiveMenu, isGoogleAuthenticated } = useEditorStore()

  return (
    <aside className="w-[256px] min-w-[256px] h-full flex flex-col bg-[var(--sidebar)]">
      {/* Drag region for window controls */}
      <div className="drag-region h-[52px] flex-shrink-0" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pb-4">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <span className="font-mono font-bold text-base text-white tracking-tight">DOC2MD</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-medium font-mono text-[var(--sidebar-foreground)] tracking-widest uppercase">Menu</p>
        <div className="flex flex-col gap-0.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              aria-current={activeMenu === item.id ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeMenu === item.id
                  ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]'
                  : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
              }`}
            >
              <span className="material-symbols-sharp text-[20px]" style={{ fontVariationSettings: "'wght' 300" }}>
                {item.icon}
              </span>
              <span className="font-sans">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 mx-3 mb-3 rounded-lg bg-[var(--sidebar-accent)]">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${isGoogleAuthenticated ? 'bg-emerald-400' : 'bg-[var(--sidebar-foreground)]'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--sidebar-accent-foreground)] truncate font-sans">
              {isGoogleAuthenticated ? 'Google 連携中' : 'オフライン'}
            </p>
            <p className="text-xs text-[var(--sidebar-foreground)] truncate font-sans">
              {isGoogleAuthenticated ? 'Google Workspace' : 'ローカルファイル'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
