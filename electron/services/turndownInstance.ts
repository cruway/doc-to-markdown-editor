import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})

turndown.use(gfm)

// Google Docs HTML 前処理: 不要な inline CSS やタグを除去
export function cleanGoogleDocsHtml(html: string): string {
  let cleaned = html

  // [H-01] font-weight:700 / bold の span を <strong> に正規化（[\s\S]*? でマルチライン対応）
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*font-weight:\s*(?:700|bold)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<strong>$1</strong>'
  )

  // [H-01] font-style:italic の span を <em> に正規化
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<em>$1</em>'
  )

  // [H-01] text-decoration:line-through の span を <del> に正規化
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*text-decoration:\s*line-through[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<del>$1</del>'
  )

  // style 属性を除去
  cleaned = cleaned.replace(/ style="[^"]*"/gi, '')

  // class 属性を除去
  cleaned = cleaned.replace(/ class="[^"]*"/gi, '')

  // [H-02] 空の span タグを再帰的に除去（ネストされた span にも対応）
  let prev = ''
  while (prev !== cleaned) {
    prev = cleaned
    cleaned = cleaned.replace(/<span>([\s\S]*?)<\/span>/g, '$1')
  }

  // テーブルセル内の <p> タグを除去（turndown のテーブル認識を妨げるため）
  cleaned = cleaned.replace(/<td([^>]*)>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/td>/gi, '<td$1>$2</td>')
  cleaned = cleaned.replace(/<th([^>]*)>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/th>/gi, '<th$1>$2</th>')

  // <thead> がないテーブルの先頭行を <thead> で囲む（turndown-plugin-gfm が要求）
  cleaned = cleaned.replace(
    /<table([^>]*)>([\s\S]*?)<\/table>/gi,
    (match, tableAttrs, tableContent) => {
      if (match.includes('<thead')) return match

      // Remove wrapping <tbody> if present
      let content = tableContent.replace(/<\/?tbody[^>]*>/gi, '')

      // Extract first <tr>...</tr>
      const firstRowMatch = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/i)
      if (!firstRowMatch) return match

      const firstRow = firstRowMatch[0]
      const restContent = content.slice(content.indexOf(firstRow) + firstRow.length)

      // Convert td to th in header row
      const headerRow = firstRow.replace(/<td/gi, '<th').replace(/<\/td>/gi, '</th>')

      return `<table${tableAttrs}><thead>${headerRow}</thead><tbody>${restContent}</tbody></table>`
    }
  )

  // 不要な <br> の連続（3つ以上）を段落区切りに
  cleaned = cleaned.replace(/(<br\s*\/?>){3,}/gi, '</p><p>')

  return cleaned
}

export { turndown }
