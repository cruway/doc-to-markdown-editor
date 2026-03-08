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
  const { mergedMarkdown, setMergedMarkdown } = useEditorStore()

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
          if (update.docChanged) {
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
      view.destroy()
      viewRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external markdown changes to the editor
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentDoc = view.state.doc.toString()
    if (currentDoc !== mergedMarkdown) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: mergedMarkdown },
      })
    }
  }, [mergedMarkdown])

  return (
    <section className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between h-11 px-4 bg-[var(--secondary)] rounded-t-lg border border-[var(--border)]">
        <span className="text-sm font-semibold text-[var(--foreground)] font-sans">Markdown エディタ</span>
        {/* [P2-05] 未実装ツールバーボタンを削除 */}
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto bg-[var(--card)] border-x border-b border-[var(--border)] rounded-b-lg"
      />
    </section>
  )
}
