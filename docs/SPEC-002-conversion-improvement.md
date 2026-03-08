# SPEC-002: ドキュメント→Markdown 変換パイプライン改善

## メタ情報

| 項目 | 値 |
|:-----|:---|
| SPEC ID | SPEC-002 |
| 作成日 | 2026-03-08 |
| ステータス | Implemented (Phase 1 & 2) |
| 優先度 | High |
| 前提 SPEC | SPEC-001 |

---

## 1. 目的

現行の変換パイプライン（mammoth.js + turndown）の品質・対応範囲の問題を解決し、Google Docs / Google Sheets / ローカル DOCX ファイルを高精度にMarkdownへ変換できるようにする。

---

## 2. 現状分析

### 2.1 現行アーキテクチャ

```
[ローカル .docx] → mammoth.js → HTML → turndown → Markdown
[ローカル .html] → turndown → Markdown
[ローカル .md/.txt] → パススルー
[Google Docs] → Drive API export(text/html) → turndown → Markdown
[Google Sheets] → 未対応
```

### 2.2 確認された問題点

| ID | 問題 | 影響度 | 該当ファイル |
|:---|:-----|:-------|:------------|
| P-01 | turndown-plugin-gfm 未使用 → テーブル・取消線が変換不可 | Critical | `converter.ts:7-11` |
| P-02 | Google Sheets 完全未対応 | Critical | `googleService.ts:136` |
| P-03 | turndown インスタンスが2箇所で重複生成 → 設定不整合リスク | Medium | `converter.ts:7`, `googleService.ts:175` |
| P-04 | Google Docs HTML export に含まれる大量の inline CSS が未処理 | Medium | `googleService.ts:169-172` |
| P-05 | 画像が base64 データURL のまま Markdown に出力 | Medium | 変換パイプライン全体 |
| P-06 | 中첩リストが平坦化される場合がある | Low | turndown の既知制限 |
| P-07 | 統合時のセクション区切りがハードコード（`---`のみ） | Low | `converter.ts:64` |

---

## 3. スコープ

### In Scope

- GFM テーブル・取消線・タスクリストの変換対応
- Google Sheets → Markdown テーブル変換
- 変換パイプラインの統合・最適化
- Google Docs HTML の前処理（CSS クリーンアップ）
- 画像の外部ファイル抽出
- セクション区切りのカスタマイズ

### Out of Scope

- Google Docs API `documents.get()` による構造化JSON変換（Phase 3 以降で検討）
- pandoc バンドル（アプリサイズ肥大化のため見送り）
- Google Docs の非公式 Markdown export エンドポイント（安定性未保証）

---

## 4. 改善仕様

### Phase 1: 即時改善（既存スタック活用）

#### F-10: GFM プラグイン導入

**対象問題:** P-01

```
追加パッケージ: turndown-plugin-gfm
```

変換対応の拡張:

| 要素 | 現状 | 改善後 |
|:-----|:-----|:-------|
| テーブル | ✗ 無視される | ✓ GFM パイプテーブル記法 |
| 取消線 | ✗ 無視される | ✓ `~~text~~` |
| タスクリスト | ✗ 無視される | ✓ `- [ ] / - [x]` |

実装:

```typescript
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})
turndown.use(gfm)

export { turndown }
```

#### F-11: turndown インスタンス統合

**対象問題:** P-03

```
変更ファイル:
  - electron/services/turndownInstance.ts (新規: 共通インスタンス)
  - electron/services/converter.ts (import 変更)
  - electron/services/googleService.ts (import 変更, require 削除)
```

#### F-12: Google Sheets 基本対応（CSV 経由）

**対象問題:** P-02

```
入力: Google Sheets ファイル ID
処理:
  1. Drive API で text/csv として export
  2. CSV をパース（行×列の2次元配列）
  3. GFM テーブル記法へ変換
出力: Markdown テーブル文字列
```

IPC ハンドラ追加:

| チャンネル | 入力 | 出力 | 説明 |
|:--------|:-----|:-----|:-----|
| `google:downloadSheet` | fileId, sheetName? | `{ markdown }` | Sheets → MD テーブル変換 |

対象 MIME タイプ追加:

```typescript
// google:listFiles の query を拡張
"mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet'"
```

CSV → Markdown テーブル変換ロジック:

```typescript
function csvToMarkdownTable(csv: string): string {
  const rows = parseCSV(csv)
  if (rows.length === 0) return ''

  const header = rows[0]
  const separator = header.map(() => '---')
  const body = rows.slice(1)

  const lines = [
    '| ' + header.join(' | ') + ' |',
    '| ' + separator.join(' | ') + ' |',
    ...body.map(row => '| ' + row.join(' | ') + ' |'),
  ]

  return lines.join('\n')
}
```

#### F-13: ファイルリスト MIME タイプ拡張

**対象問題:** P-02

`google:listFiles` と `google:scanFolder` で Google Sheets も取得対象に含める。

```typescript
// 変更前
"mimeType='application/vnd.google-apps.document' and trashed=false"

// 変更後
"(mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet') and trashed=false"
```

ファイルデータに `isGoogleSheet` フラグを追加:

```typescript
interface DriveFile {
  id: string
  name: string
  path: string
  extension: string       // '.gdoc' | '.gsheet'
  lastModified: number
  isGoogleDoc: boolean
  isGoogleSheet: boolean
  mimeType: string
}
```

---

### Phase 2: 変換品質向上

#### F-20: Google Docs HTML 前処理

**対象問題:** P-04

Google Docs の HTML export に含まれる不要な要素を turndown 変換前に除去する。

```typescript
function cleanGoogleDocsHtml(html: string): string {
  let cleaned = html
  // Google Docs 固有の style 属性を除去
  cleaned = cleaned.replace(/ style="[^"]*"/g, '')
  // 空の span タグを除去
  cleaned = cleaned.replace(/<span>(.*?)<\/span>/g, '$1')
  // Google Docs の font-weight: 700 を <strong> に正規化
  cleaned = cleaned.replace(
    /<span style="font-weight:\s*(?:700|bold)[^"]*">(.*?)<\/span>/g,
    '<strong>$1</strong>'
  )
  // 不要な <br> の連続を段落区切りに
  cleaned = cleaned.replace(/(<br\s*\/?>){3,}/g, '</p><p>')
  return cleaned
}
```

適用箇所:

```
[Google Docs] → Drive API export(text/html) → cleanGoogleDocsHtml() → turndown → Markdown
```

#### F-21: 画像ファイル抽出

**対象問題:** P-05

```
入力: base64 画像を含む HTML
処理:
  1. <img src="data:image/...;base64,..."> を検出
  2. base64 をデコードしてローカルファイルに保存
  3. HTML 内の src を相対パスに置換
出力: 画像ファイル群 + 画像パスが置換された HTML
```

保存先構成:

```
output/
├── document.md
└── images/
    ├── image-001.png
    ├── image-002.jpg
    └── ...
```

Markdown 出力例:

```markdown
![image](./images/image-001.png)
```

#### F-22: セクション区切りカスタマイズ

**対象問題:** P-07

```typescript
interface MergeOptions {
  separator: 'hr' | 'heading' | 'none'
  // hr:      "\n\n---\n\n"
  // heading: "\n\n## 起\n\n" ... "\n\n## 承\n\n" ...
  // none:    "\n\n"
}
```

---

### Phase 3: 高度な変換（将来検討）

| 機能 | 概要 | 検討理由 |
|:-----|:-----|:---------|
| F-30: unified 生態系移行 | turndown → rehype-remark + remark-gfm + remark-stringify | AST ベースで拡張性が高い |
| F-31: Sheets 多重シート対応 | SheetJS (xlsx) による .xlsx パース → シート別テーブル | CSV は先頭シートのみの制限回避 |
| F-32: Docs API 構造化変換 | documents.get() JSON → 独自 mdast 変換 | 最高精度の変換が可能 |
| F-33: .doc (旧形式) 対応 | LibreOffice CLI 変換 or Apache POI | レガシーファイル対応 |

---

## 5. データモデル変更

### 5.1 DriveFile インターフェース拡張

```typescript
// 変更前
interface LocalFile {
  path: string
  name: string
  extension: string   // .docx | .md | .html | .txt
  size: number
  lastModified: Date
}

// 変更後
interface DocumentFile {
  path: string
  name: string
  extension: string   // .docx | .md | .html | .txt | .gdoc | .gsheet
  size?: number
  lastModified: number
  source: 'local' | 'google-drive'
  mimeType?: string
  googleFileId?: string
}
```

### 5.2 MergeOptions 追加

```typescript
interface MergeOptions {
  separator: 'hr' | 'heading' | 'none'
  extractImages: boolean
  imageOutputDir?: string
}
```

---

## 6. IPC API 変更

### 新規追加

| チャンネル | 入力 | 出力 | 説明 |
|:--------|:-----|:-----|:-----|
| `google:downloadSheet` | fileId: string | `{ markdown: string }` | Sheets → MD テーブル |

### 変更

| チャンネル | 変更内容 |
|:--------|:---------|
| `google:listFiles` | MIME フィルタに Sheets を追加 |
| `google:scanFolder` | MIME フィルタに Sheets を追加 + isGoogleSheet フラグ |
| `google:downloadDoc` | HTML 前処理 (cleanGoogleDocsHtml) を追加 |
| `file:mergeDocuments` | MergeOptions パラメータを追加 |

---

## 7. ファイル変更一覧

### Phase 1

| ファイル | 操作 | 内容 |
|:---------|:-----|:-----|
| `package.json` | 変更 | `turndown-plugin-gfm` 追加 |
| `electron/services/turndownInstance.ts` | 新規 | 共通 turndown インスタンス + GFM プラグイン |
| `electron/services/converter.ts` | 変更 | turndown を共通インスタンスに置換 |
| `electron/services/googleService.ts` | 変更 | turndown 共通化 + Sheets 対応 + HTML 前処理 |
| `electron/services/csvParser.ts` | 新規 | CSV → Markdown テーブル変換 |
| `src/types/index.ts` | 変更 | DocumentFile, MergeOptions 型追加 |

### Phase 2

| ファイル | 操作 | 内容 |
|:---------|:-----|:-----|
| `electron/services/htmlCleaner.ts` | 新規 | Google Docs HTML 前処理 |
| `electron/services/imageExtractor.ts` | 新規 | base64 画像抽出・保存 |
| `electron/services/converter.ts` | 変更 | MergeOptions 対応 |
| `src/components/ActionBar.tsx` | 変更 | セクション区切りオプション UI |

---

## 8. 依存パッケージ

### 追加（Phase 1）

| パッケージ | バージョン | 用途 |
|:----------|:----------|:-----|
| `turndown-plugin-gfm` | ^1.0.2 | GFM テーブル・取消線・タスクリスト |
| `@types/turndown-plugin-gfm` | ^1.0.2 (存在する場合) | 型定義 |

### 追加（Phase 2）

| パッケージ | バージョン | 用途 |
|:----------|:----------|:-----|
| なし | — | 標準ライブラリ（fs, path, Buffer）のみで実装 |

---

## 9. テスト計画

### 9.1 変換精度テスト

| テスト ID | テスト内容 | 期待結果 |
|:----------|:----------|:---------|
| T-01 | テーブルを含む .docx の変換 | GFM パイプテーブルとして出力 |
| T-02 | 取消線・タスクリストを含む .docx | `~~text~~`, `- [ ]` として出力 |
| T-03 | Google Docs（テーブル含む）の変換 | テーブルが GFM 形式で出力 |
| T-04 | Google Sheets の単一シート変換 | 全行列が GFM テーブルとして出力 |
| T-05 | Google Docs の太字・見出し・リスト変換 | 各要素が正しい MD 記法で出力 |
| T-06 | base64 画像を含むドキュメント | 画像がローカルファイルに抽出される |
| T-07 | 中첩リスト（3階層）の変換 | インデント付きリストとして出力 |

### 9.2 結合テスト

| テスト ID | テスト内容 | 期待結果 |
|:----------|:----------|:---------|
| T-10 | Docs + Sheets 混在の統合 | 本文 + テーブルが統合される |
| T-11 | セクション区切り hr/heading/none | 各モードで正しい区切りが挿入 |
| T-12 | 空スロットを含む統合 | スキップされ、余計な区切りが入らない |

---

## 10. 受入基準

### Phase 1

- [x] テーブルを含む Google Docs が GFM テーブル形式で変換される
- [x] 取消線が `~~text~~` に変換される
- [x] Google Sheets が Markdown テーブルとして変換・表示される
- [x] `google:listFiles` で Google Sheets も一覧に表示される
- [x] turndown の設定が全変換で統一されている

### Phase 2

- [x] Google Docs HTML の不要な CSS が除去されたクリーンな MD が出力される
- [x] base64 画像がローカルファイルに抽出され、MD では相対パスで参照される
- [x] セクション区切りの種類を選択できる

---

## 11. リスク

| リスク | 影響 | 対策 |
|:-------|:-----|:-----|
| Google Sheets CSV export は先頭シートのみ | 複数シートのデータが取得不可 | Phase 3 で SheetJS 対応を検討 |
| HTML 前処理の正規表現が過剰にマッチ | 本来必要な要素まで除去される | テストケースを充実させ、段階的に精度向上 |
| turndown-plugin-gfm の複雑テーブル対応 | colspan/rowspan は MD で表現不可 | HTML フォールバックまたは警告表示 |
| base64 画像のサイズ | 大量画像でメモリ・ディスク消費増大 | 画像サイズ上限設定 + 警告表示 |

---

## 12. 実装フェーズとスケジュール

| フェーズ | 内容 | 優先度 |
|:---------|:-----|:-------|
| Phase 1-A | F-10: GFM プラグイン導入 | Must |
| Phase 1-B | F-11: turndown インスタンス統合 | Must |
| Phase 1-C | F-12/F-13: Google Sheets 対応 | Must |
| Phase 2-A | F-20: HTML 前処理 | Should |
| Phase 2-B | F-21: 画像ファイル抽出 | Should |
| Phase 2-C | F-22: セクション区切りカスタマイズ | Could |
| Phase 3 | F-30〜F-33: 高度な変換 | Won't (今回) |
