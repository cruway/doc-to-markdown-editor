import { useEditorStore } from '../stores/editorStore'
import { SlotCard } from './SlotCard'

export function SlotPanel() {
  const { slots } = useEditorStore()

  return (
    <section>
      <h3 className="text-base font-semibold font-mono text-[var(--foreground)] mb-4">構成設定</h3>
      <div className="grid grid-cols-4 gap-4">
        {slots.map((slot) => (
          <SlotCard key={slot.type} slot={slot} />
        ))}
      </div>
    </section>
  )
}
