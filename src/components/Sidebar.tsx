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
    <aside className="w-[280px] min-w-[280px] h-full flex flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      {/* Logo */}
      <div className="h-[88px] flex items-center gap-3 px-8 border-b border-[var(--sidebar-border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <span className="font-mono font-bold text-lg text-[var(--primary)]">DOC2MD</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2">
        <p className="px-4 py-3 text-sm font-mono text-[var(--sidebar-foreground)]">MENU</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            aria-current={activeMenu === item.id ? 'page' : undefined}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-full text-base transition-colors ${
              activeMenu === item.id
                ? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]'
                : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/50'
            }`}
          >
            <span className="material-symbols-sharp text-[24px]" style={{ fontVariationSettings: "'wght' 100" }}>
              {item.icon}
            </span>
            <span className="font-sans">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-8 py-6 flex items-center gap-3 border-t border-[var(--sidebar-border)]">
        <div className="flex-1 min-w-0">
          <p className="text-base text-[var(--sidebar-accent-foreground)] truncate font-sans">
            {isGoogleAuthenticated ? 'Google 連携中' : 'オフラインモード'}
          </p>
          <p className="text-sm text-[var(--sidebar-foreground)] truncate font-sans">
            {isGoogleAuthenticated ? 'Google Workspace' : 'ローカルファイル'}
          </p>
        </div>
      </div>
    </aside>
  )
}
