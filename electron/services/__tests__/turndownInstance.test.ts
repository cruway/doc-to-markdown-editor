import { describe, it, expect } from 'vitest'
import { turndown, cleanGoogleDocsHtml } from '../turndownInstance'

describe('turndown with GFM plugin', () => {
  // T-01: テーブルを含む HTML の変換 → GFM パイプテーブルとして出力
  it('converts HTML table to GFM markdown table', () => {
    const html = `
      <table>
        <thead><tr><th>Name</th><th>Age</th></tr></thead>
        <tbody>
          <tr><td>Alice</td><td>30</td></tr>
          <tr><td>Bob</td><td>25</td></tr>
        </tbody>
      </table>
    `
    const md = turndown.turndown(html)

    expect(md).toContain('| Name | Age |')
    expect(md).toContain('| Alice | 30 |')
    expect(md).toContain('| Bob | 25 |')
    expect(md).toMatch(/\| ---/)
  })

  // T-02: 取消線 → ~text~ (GFM single tilde via turndown-plugin-gfm)
  it('converts strikethrough to ~text~', () => {
    const html = '<p>This is <del>deleted</del> text</p>'
    const md = turndown.turndown(html)

    expect(md).toContain('~deleted~')
  })

  // T-02: タスクリスト → - [ ] / - [x]
  it('converts task lists', () => {
    const html = `
      <ul>
        <li><input type="checkbox" disabled> Unchecked</li>
        <li><input type="checkbox" checked disabled> Checked</li>
      </ul>
    `
    const md = turndown.turndown(html)

    expect(md).toMatch(/\[ \]/)
    expect(md).toMatch(/\[x\]/)
  })

  // T-05: 太字・見出し・リスト → 正しい MD 記法
  it('converts headings with atx style', () => {
    const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>'
    const md = turndown.turndown(html)

    expect(md).toContain('# Title')
    expect(md).toContain('## Subtitle')
    expect(md).toContain('### Section')
  })

  it('converts bold and italic', () => {
    const html = '<p><strong>bold</strong> and <em>italic</em></p>'
    const md = turndown.turndown(html)

    expect(md).toContain('**bold**')
    expect(md).toContain('_italic_')
  })

  it('converts unordered lists with dash marker', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const md = turndown.turndown(html)

    // turndown may add extra spaces after marker
    expect(md).toMatch(/-\s+Item 1/)
    expect(md).toMatch(/-\s+Item 2/)
  })

  it('converts ordered lists', () => {
    const html = '<ol><li>First</li><li>Second</li></ol>'
    const md = turndown.turndown(html)

    expect(md).toMatch(/1\.\s+First/)
    expect(md).toMatch(/2\.\s+Second/)
  })

  it('converts links', () => {
    const html = '<a href="https://example.com">Example</a>'
    const md = turndown.turndown(html)

    expect(md).toContain('[Example](https://example.com)')
  })

  it('converts fenced code blocks', () => {
    const html = '<pre><code>const x = 1;</code></pre>'
    const md = turndown.turndown(html)

    expect(md).toContain('```')
    expect(md).toContain('const x = 1;')
  })

  // T-07: ネストされたリスト（3階層）
  it('converts nested lists', () => {
    const html = `
      <ul>
        <li>Level 1
          <ul>
            <li>Level 2
              <ul>
                <li>Level 3</li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    `
    const md = turndown.turndown(html)

    expect(md).toContain('Level 1')
    expect(md).toContain('Level 2')
    expect(md).toContain('Level 3')
    // Check indentation exists
    const lines = md.split('\n').filter(l => l.trim())
    const indentedLines = lines.filter(l => l.startsWith('  ') || l.startsWith('    '))
    expect(indentedLines.length).toBeGreaterThan(0)
  })
})

describe('cleanGoogleDocsHtml', () => {
  it('converts font-weight:700 spans to <strong>', () => {
    const html = '<span style="font-weight:700">bold text</span>'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).toContain('<strong>bold text</strong>')
    expect(cleaned).not.toContain('font-weight')
  })

  it('converts font-weight:bold spans to <strong>', () => {
    const html = '<span style="font-weight: bold; color: red;">bold text</span>'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).toContain('<strong>bold text</strong>')
  })

  it('converts font-style:italic spans to <em>', () => {
    const html = '<span style="font-style: italic">italic text</span>'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).toContain('<em>italic text</em>')
  })

  it('converts text-decoration:line-through to <del>', () => {
    const html = '<span style="text-decoration: line-through">deleted</span>'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).toContain('<del>deleted</del>')
  })

  it('removes style attributes', () => {
    const html = '<p style="margin-top: 0pt; color: #333;">Hello</p>'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).not.toContain('style=')
    expect(cleaned).toContain('Hello')
  })

  it('removes class attributes', () => {
    const html = '<p class="c1 c2">Hello</p>'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).not.toContain('class=')
    expect(cleaned).toContain('Hello')
  })

  it('removes empty span tags', () => {
    const html = '<span>just text</span>'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).toBe('just text')
    expect(cleaned).not.toContain('<span>')
  })

  it('converts excessive br tags to paragraph breaks', () => {
    const html = 'text1<br><br><br><br>text2'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).toContain('</p><p>')
    expect(cleaned).not.toMatch(/<br.*?><br.*?><br/)
  })

  it('preserves two br tags (does not convert)', () => {
    const html = 'text1<br><br>text2'
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).toContain('<br><br>')
  })

  it('handles complex Google Docs HTML', () => {
    const html = `
      <p class="c1" style="margin:0;padding:0;">
        <span style="font-weight:700;font-size:14pt;">Title</span>
      </p>
      <p class="c2" style="line-height:1.5;">
        <span style="font-style:italic">emphasis</span> and
        <span style="text-decoration:line-through">removed</span>
      </p>
    `
    const cleaned = cleanGoogleDocsHtml(html)

    expect(cleaned).toContain('<strong>Title</strong>')
    expect(cleaned).toContain('<em>emphasis</em>')
    expect(cleaned).toContain('<del>removed</del>')
    expect(cleaned).not.toContain('style=')
    expect(cleaned).not.toContain('class=')
  })
})
