/**
 * CSV 文字列を GFM Markdown テーブルに変換する
 */

function parseCSV(csv: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') {
          current += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(current.trim())
        current = ''
      } else if (char === '\n') {
        currentRow.push(current.trim())
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
        current = ''
      } else if (char === '\r') {
        // skip carriage return
        continue
      } else {
        current += char
      }
    }
  }

  // Handle last field
  currentRow.push(current.trim())
  if (currentRow.some(c => c !== '')) {
    rows.push(currentRow)
  }

  return rows
}

function escapeTableCell(cell: string): string {
  return cell.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

// CSV テーブルの最大列数制限
const MAX_CSV_COLUMNS = 1000

export function csvToMarkdownTable(csv: string): string {
  const rows = parseCSV(csv)
  if (rows.length === 0) return ''

  // 列数を最大値に統一（上限付き）
  const maxCols = Math.min(Math.max(...rows.map(r => r.length)), MAX_CSV_COLUMNS)
  const normalized = rows.map(row => {
    while (row.length < maxCols) row.push('')
    return row.map(escapeTableCell)
  })

  const header = normalized[0]
  const separator = header.map(() => '---')
  const body = normalized.slice(1)

  const result = [
    '| ' + header.join(' | ') + ' |',
    '| ' + separator.join(' | ') + ' |',
    ...body.map(row => '| ' + row.join(' | ') + ' |'),
  ]

  return result.join('\n')
}
