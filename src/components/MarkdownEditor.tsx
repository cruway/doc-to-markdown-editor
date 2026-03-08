import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { useEditorStore } from '../stores/editorStore'

const theme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", monospace',
  },
  '.cm-content': {
    padding: '16px',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--muted-foreground)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--secondary)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--foreground)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
})

export function MarkdownEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isSyncingRef = useRef(false)
  const { mergedMarkdown, setMergedMarkdown } = useEditorStore()

  // EditorView のライフサイクル: マウント時に1回だけ初期化。
  // setMergedMarkdown は Zustand の安定参照のため deps 不要。
  // 外部からのコンテンツ同期は下の useEffect で処理。
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: mergedMarkdown,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        theme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isSyncingRef.current) {
            setMergedMarkdown(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 外部 markdown 変更をエディタに同期（sync loop 防止付き）
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentDoc = view.state.doc.toString()
    if (currentDoc !== mergedMarkdown) {
      isSyncingRef.current = true
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: mergedMarkdown },
      })
      isSyncingRef.current = false
    }
  }, [mergedMarkdown])

  return (
    <section className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between h-11 px-4 bg-[var(--secondary)] rounded-t-lg border border-[var(--border)]">
        <span className="text-sm font-semibold text-[var(--foreground)] font-sans">Markdown エディタ</span>
        <div className="flex items-center gap-2">
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--border)] transition-colors" aria-label="Bold">
            <span className="material-symbols-sharp text-[18px] text-[var(--muted-foreground)]" style={{ fontVariationSettings: "'wght' 300" }}>format_bold</span>
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--border)] transition-colors" aria-label="Italic">
            <span className="material-symbols-sharp text-[18px] text-[var(--muted-foreground)]" style={{ fontVariationSettings: "'wght' 300" }}>format_italic</span>
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--border)] transition-colors" aria-label="Heading">
            <span className="material-symbols-sharp text-[18px] text-[var(--muted-foreground)]" style={{ fontVariationSettings: "'wght' 300" }}>title</span>
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--border)] transition-colors" aria-label="List">
            <span className="material-symbols-sharp text-[18px] text-[var(--muted-foreground)]" style={{ fontVariationSettings: "'wght' 300" }}>format_list_bulleted</span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto bg-[var(--card)] border-x border-b border-[var(--border)] rounded-b-lg shadow-sm"
      />
    </section>
  )
}
