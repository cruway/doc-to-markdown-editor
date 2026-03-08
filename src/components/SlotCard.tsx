import { useState } from 'react'
import type { SlotConfig } from '../types'
import { useEditorStore } from '../stores/editorStore'

interface SlotCardProps {
  slot: SlotConfig
}

export function SlotCard({ slot }: SlotCardProps) {
  const { removeFileFromSlot, addFileToSlot } = useEditorStore()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleAddFile = async () => {
    const files = await window.electronAPI.openFiles(['docx', 'md', 'html', 'txt'])
    for (const file of files) {
      addFileToSlot(slot.type, file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const data = e.dataTransfer.getData('application/json')
    if (data) {
      try {
        const { file, fromSlot } = JSON.parse(data)
        if (fromSlot !== slot.type) {
          const store = useEditorStore.getState()
          const fromSlotData = store.slots.find(s => s.type === fromSlot)
          if (fromSlotData) {
            const idx = fromSlotData.files.findIndex(f => f.path === file.path)
            if (idx >= 0) {
              store.removeFileFromSlot(fromSlot, idx)
              store.addFileToSlot(slot.type, file)
            }
          }
        }
      } catch {
        // ドラッグデータが不正な場合は無視
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  return (
    <div
      className={`flex-1 min-w-0 rounded border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden ${isDragOver ? 'ring-2' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="region"
      aria-label={`${slot.label} ドロップゾーン`}
      style={{ '--tw-ring-color': slot.color } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-[var(--border)]">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: slot.color }}
        >
          {slot.type}
        </div>
        <span className="text-sm font-semibold text-[var(--foreground)] font-sans">{slot.label}</span>
      </div>

      {/* File list */}
      <div className="px-4 py-3 min-h-[60px]">
        {slot.files.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)] font-sans">ファイルをドロップ</p>
        ) : (
          <div className="flex flex-col gap-1.5" role="list">
            {slot.files.map((file, index) => (
              <div
                key={`${slot.type}-${file.path}-${file.lastModified || index}`}
                draggable
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    removeFileFromSlot(slot.type, index)
                  }
                }}
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ file, fromSlot: slot.type })
                  )
                }}
                className="flex items-center justify-between group cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded px-1"
              >
                <span className={`text-[13px] font-sans truncate ${index === 0 ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                  {file.name}
                </span>
                <button
                  onClick={() => removeFileFromSlot(slot.type, index)}
                  aria-label={`${file.name} を削除`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-opacity ml-2"
                >
                  <span className="material-symbols-sharp text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={handleAddFile}
        className="w-full h-10 flex items-center justify-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/50 transition-colors border-t border-[var(--border)]"
      >
        <span className="material-symbols-sharp text-[16px]">add</span>
        <span className="text-[13px] font-sans">ファイルを追加</span>
      </button>
    </div>
  )
}
