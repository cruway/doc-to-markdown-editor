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

  // font-weight:700 / bold の span を <strong> に正規化（style 除去前に実行）
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*font-weight:\s*(?:700|bold)[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<strong>$1</strong>'
  )

  // font-style:italic の span を <em> に正規化
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<em>$1</em>'
  )

  // text-decoration:line-through の span を <del> に正規化
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*text-decoration:\s*line-through[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<del>$1</del>'
  )

  // style 属性を除去
  cleaned = cleaned.replace(/ style="[^"]*"/gi, '')

  // class 属性を除去
  cleaned = cleaned.replace(/ class="[^"]*"/gi, '')

  // 空の span タグを除去
  cleaned = cleaned.replace(/<span>(.*?)<\/span>/g, '$1')

  // テーブルセル内の <p> タグを除去（turndown のテーブル認識を妨げるため）
  cleaned = cleaned.replace(/<td([^>]*)>\s*<p[^>]*>(.*?)<\/p>\s*<\/td>/gi, '<td$1>$2</td>')
  cleaned = cleaned.replace(/<th([^>]*)>\s*<p[^>]*>(.*?)<\/p>\s*<\/th>/gi, '<th$1>$2</th>')

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
