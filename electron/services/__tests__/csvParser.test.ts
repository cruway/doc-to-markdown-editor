import { describe, it, expect } from 'vitest'
import { csvToMarkdownTable } from '../csvParser'

describe('csvToMarkdownTable', () => {
  // T-04: Google Sheets 単一シート変換 → 全行列が GFM テーブルとして出力
  it('converts basic CSV to GFM table', () => {
    const csv = 'Name,Age,City\nAlice,30,Tokyo\nBob,25,Osaka'
    const result = csvToMarkdownTable(csv)

    expect(result).toBe(
      '| Name | Age | City |\n' +
      '| --- | --- | --- |\n' +
      '| Alice | 30 | Tokyo |\n' +
      '| Bob | 25 | Osaka |'
    )
  })

  it('returns empty string for empty CSV', () => {
    expect(csvToMarkdownTable('')).toBe('')
    expect(csvToMarkdownTable('\n\n')).toBe('')
  })

  it('handles single header row (no body)', () => {
    const csv = 'A,B,C'
    const result = csvToMarkdownTable(csv)

    expect(result).toBe(
      '| A | B | C |\n' +
      '| --- | --- | --- |'
    )
  })

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Description\n"Alice","Has a cat, dog"'
    const result = csvToMarkdownTable(csv)

    expect(result).toContain('| Has a cat, dog |')
  })

  it('handles escaped quotes inside quoted fields', () => {
    const csv = 'Name,Quote\nAlice,"She said ""hello"""'
    const result = csvToMarkdownTable(csv)

    expect(result).toContain('She said "hello"')
  })

  it('escapes pipe characters in cell content', () => {
    const csv = 'Formula,Result\nA|B,OK'
    const result = csvToMarkdownTable(csv)

    expect(result).toContain('A\\|B')
  })

  it('normalizes uneven column counts', () => {
    const csv = 'A,B,C\n1,2\n3,4,5'
    const result = csvToMarkdownTable(csv)

    const lines = result.split('\n')
    // Each row should have 3 columns
    lines.forEach(line => {
      const pipes = line.match(/\|/g)
      expect(pipes?.length).toBe(4) // 3 columns = 4 pipes
    })
  })

  it('handles Japanese content', () => {
    const csv = '名前,年齢,都市\n太郎,30,東京\n花子,25,大阪'
    const result = csvToMarkdownTable(csv)

    expect(result).toContain('| 太郎 | 30 | 東京 |')
    expect(result).toContain('| 花子 | 25 | 大阪 |')
  })

  it('handles newlines inside cells by replacing with space', () => {
    const csv = 'Name,Note\nAlice,"Line1\nLine2"'
    const result = csvToMarkdownTable(csv)

    expect(result).toContain('Line1 Line2')
    expect(result).not.toContain('Line1\nLine2')
  })
})
