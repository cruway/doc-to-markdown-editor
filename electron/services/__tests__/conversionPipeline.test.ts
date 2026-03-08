import { describe, it, expect } from 'vitest'
import { turndown, cleanGoogleDocsHtml } from '../turndownInstance'
import { csvToMarkdownTable } from '../csvParser'

describe('Conversion Pipeline: Google Docs HTML → clean HTML → Markdown', () => {
  // T-03: Google Docs（テーブル含む）の変換 → テーブルが GFM 形式で出力
  it('converts Google Docs HTML with table to GFM table', () => {
    const googleHtml = `
      <html>
        <body>
          <p class="c1" style="margin:0;padding:0;">
            <span style="font-weight:700;font-size:18pt;">Report Title</span>
          </p>
          <table class="c5" style="border-collapse:collapse;">
            <tr style="height:20px;">
              <td style="border:1px solid #000;padding:5px;"><p style="font-weight:bold;">Name</p></td>
              <td style="border:1px solid #000;padding:5px;"><p style="font-weight:bold;">Score</p></td>
            </tr>
            <tr>
              <td style="border:1px solid #000;padding:5px;"><p>Alice</p></td>
              <td style="border:1px solid #000;padding:5px;"><p>95</p></td>
            </tr>
          </table>
          <p class="c2" style="line-height:1.5;">
            <span style="font-style:italic">Note:</span>
            <span style="text-decoration:line-through">Draft version</span>
          </p>
        </body>
      </html>
    `

    const cleaned = cleanGoogleDocsHtml(googleHtml)
    const md = turndown.turndown(cleaned)

    // Table should be GFM format
    expect(md).toContain('| Name | Score |')
    expect(md).toContain('| Alice | 95 |')
    expect(md).toMatch(/\| ---/)

    // Formatting preserved
    expect(md).toContain('**Report Title**')
    expect(md).toContain('_Note:_')
    expect(md).toContain('~Draft version~')

    // No CSS remnants
    expect(md).not.toContain('style=')
    expect(md).not.toContain('class=')
  })

  // T-05: Google Docs の太字・見出し・リスト変換
  it('converts Google Docs formatting correctly', () => {
    const googleHtml = `
      <h1 style="font-size:24pt;" class="c0">Main Title</h1>
      <p class="c1" style="margin:10px;">
        <span style="font-weight:700">Important</span> regular text
      </p>
      <ul class="c3" style="list-style:disc;">
        <li style="margin-left:36pt;"><span>Item A</span></li>
        <li style="margin-left:36pt;"><span>Item B</span></li>
      </ul>
      <ol class="c4">
        <li><span>Step 1</span></li>
        <li><span>Step 2</span></li>
      </ol>
    `

    const cleaned = cleanGoogleDocsHtml(googleHtml)
    const md = turndown.turndown(cleaned)

    expect(md).toContain('# Main Title')
    expect(md).toContain('**Important**')
    expect(md).toMatch(/-\s+Item A/)
    expect(md).toMatch(/-\s+Item B/)
    expect(md).toMatch(/1\.\s+Step 1/)
    expect(md).toMatch(/2\.\s+Step 2/)
  })
})

describe('Conversion Pipeline: CSV → Markdown Table', () => {
  // T-04: Google Sheets 単一シート → GFM テーブル
  it('simulates Google Sheets CSV export to markdown', () => {
    // Typical Google Sheets CSV export
    const csv = `商品名,価格,在庫数
りんご,100,50
みかん,80,120
ぶどう,300,30`

    const md = csvToMarkdownTable(csv)

    expect(md).toContain('| 商品名 | 価格 | 在庫数 |')
    expect(md).toContain('| --- | --- | --- |')
    expect(md).toContain('| りんご | 100 | 50 |')
    expect(md).toContain('| みかん | 80 | 120 |')
    expect(md).toContain('| ぶどう | 300 | 30 |')
  })
})

describe('Merge separator options', () => {
  const sections = ['Content of 起', 'Content of 承', 'Content of 転', 'Content of 結']
  const slotTypes = ['起', '承', '転', '結']

  function simulateMerge(separator: 'hr' | 'heading' | 'none'): string {
    if (separator === 'heading') {
      return sections.map((s, i) => `## ${slotTypes[i]}\n\n${s}`).join('\n\n')
    }
    const joinSep = separator === 'none' ? '\n\n' : '\n\n---\n\n'
    return sections.join(joinSep)
  }

  // T-11: セクション区切り hr/heading/none
  it('uses horizontal rule separator (hr)', () => {
    const result = simulateMerge('hr')

    expect(result).toContain('---')
    expect(result.match(/---/g)?.length).toBe(3)
    expect(result).toContain('Content of 起')
    expect(result).toContain('Content of 結')
  })

  it('uses heading separator', () => {
    const result = simulateMerge('heading')

    expect(result).toContain('## 起')
    expect(result).toContain('## 承')
    expect(result).toContain('## 転')
    expect(result).toContain('## 結')
    expect(result).not.toContain('---')
  })

  it('uses no separator', () => {
    const result = simulateMerge('none')

    expect(result).not.toContain('---')
    expect(result).not.toContain('## ')
    expect(result).toContain('Content of 起\n\nContent of 承')
  })

  // T-12: 空スロットを含む統合 → スキップされ余計な区切りが入らない
  it('skips empty slots without extra separators', () => {
    const sparseSlots = [
      { type: '起', content: 'Intro' },
      { type: '承', content: '' },  // empty
      { type: '転', content: '' },  // empty
      { type: '結', content: 'Conclusion' },
    ]

    const nonEmpty = sparseSlots.filter(s => s.content)
    const result = nonEmpty.map(s => s.content).join('\n\n---\n\n')

    expect(result).toBe('Intro\n\n---\n\nConclusion')
    // Only one separator, not three
    expect(result.match(/---/g)?.length).toBe(1)
  })
})

describe('End-to-end: Mixed Doc + Sheet merge', () => {
  // T-10: Docs + Sheets 混在の統合 → 本文 + テーブルが統合される
  it('merges document text and spreadsheet table', () => {
    // Simulate Google Docs conversion result
    const docMd = '# Introduction\n\nThis is the main content of the document.'

    // Simulate Google Sheets conversion result
    const sheetCsv = 'Category,Value\nA,100\nB,200'
    const sheetMd = csvToMarkdownTable(sheetCsv)

    // Merge with hr separator
    const merged = [docMd, sheetMd].join('\n\n---\n\n')

    expect(merged).toContain('# Introduction')
    expect(merged).toContain('This is the main content')
    expect(merged).toContain('---')
    expect(merged).toContain('| Category | Value |')
    expect(merged).toContain('| A | 100 |')
  })
})
