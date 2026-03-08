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
        if (fromSlot === 'google-drive') {
          // Google Drive からのドロップ — そのまま追加
          addFileToSlot(slot.type, file)
        } else if (fromSlot !== slot.type) {
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
      className={`flex flex-col rounded-lg border bg-[var(--card)] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        isDragOver ? 'ring-2 border-transparent' : 'border-[var(--border)]'
      }`}
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
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ backgroundColor: slot.color }}
        >
          <span className="material-symbols-sharp text-[16px] text-white" style={{ fontVariationSettings: "'wght' 400" }}>
            {slot.type === '起' ? 'flag' : slot.type === '承' ? 'trending_up' : slot.type === '転' ? 'sync_alt' : 'check_circle'}
          </span>
        </div>
        <span className="text-sm font-semibold text-[var(--foreground)] font-sans">{slot.label}</span>
      </div>

      {/* File list */}
      <div className="px-4 py-4 min-h-[72px] flex-1">
        {slot.files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background)]/50">
            <span className="material-symbols-sharp text-[20px] text-[var(--muted-foreground)]/50 mb-1" style={{ fontVariationSettings: "'wght' 200" }}>upload_file</span>
            <p className="text-[11px] text-[var(--muted-foreground)] font-sans">ファイルをドロップ</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2" role="list">
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
                className="flex items-center justify-between group cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-[var(--ring)] rounded-md px-1 py-0.5 hover:bg-[var(--secondary)] transition-colors duration-150"
              >
                <span className={`text-[13px] font-sans truncate ${index === 0 ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                  {file.name}
                </span>
                <button
                  onClick={() => removeFileFromSlot(slot.type, index)}
                  aria-label={`${file.name} を削除`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-opacity ml-1 flex-shrink-0"
                >
                  <span className="material-symbols-sharp text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={handleAddFile}
        className="w-full h-10 flex items-center justify-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all duration-200"
      >
        <span className="material-symbols-sharp text-[16px]">add</span>
        <span className="text-[13px] font-sans">ファイルを追加</span>
      </button>
    </div>
  )
}
