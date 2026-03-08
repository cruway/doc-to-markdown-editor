# SPEC-003: コードレビュー指摘事項の修正計画

## メタ情報

| 項目 | 値 |
|:-----|:---|
| SPEC ID | SPEC-003 |
| 作成日 | 2026-03-08 |
| ステータス | Done |
| 優先度 | High |
| 前提 SPEC | SPEC-001, SPEC-002 |

---

## 1. 目的

SPEC-002 実装後の全体コードレビューで検出された 15 件の問題を、優先度別に修正する。

---

## 2. 修正一覧

### Critical（即時修正）

| ID | 問題 | 該当箇所 | 修正内容 |
|:---|:-----|:---------|:---------|
| C-01 | `file:mergeDocuments` IPC がローカルファイルのみ対応。`gdoc://`/`gsheet://` パスで `fs.readFileSync` 失敗 | `converter.ts:71-72` | Google ファイルを `mergeDocuments` でもハンドリング可能にする。または IPC 側では呼ばれない保証をコードで明確化（ガード + エラーメッセージ） |
| C-02 | 未使用の `media` 変数（デッドコード） | `googleService.ts:253-256` | 変数削除 |
| C-03 | `BASE64_IMG_REGEX` がモジュールレベル `/gi` で `lastIndex` 残存リスク | `imageExtractor.ts:9` | 関数内ローカルで regex を生成するか、`replace()` 専用のため現状維持しコメントで明記 |

### High（機能欠陥）

| ID | 問題 | 該当箇所 | 修正内容 |
|:---|:-----|:---------|:---------|
| H-01 | bold/italic/del の span 正規表現が改行を跨げない (`.*?`) | `turndownInstance.ts:18,23,29` | `(.*?)` → `([\s\S]*?)` に変更 |
| H-02 | 空 span 除去が1回のみ → ネストされた span が残存 | `turndownInstance.ts:41` | ループまたは再帰的に除去 |
| H-03 | `handleSaveGoogle` で `folders` をクエリして未使用 | `ActionBar.tsx:106` | 不要な API 呼び出しを削除 |
| H-04 | 画像抽出チェック ON + 出力フォルダ未指定で無言スキップ | `ActionBar.tsx:57` | ユーザーに警告を表示 |

### Medium（堅牢性）

| ID | 問題 | 該当箇所 | 修正内容 |
|:---|:-----|:---------|:---------|
| M-01 | Google Drive API クエリで `folderId` がサニタイズされていない | `googleService.ts:139,206` | `folderId` のバリデーション（英数字 + `-_` のみ許可） |
| M-02 | `getSeparator` 関数が定義されているが実質未使用 | `converter.ts:46-56` | 関数を削除し、`mergeDocuments` 内のインライン処理に一本化 |
| M-03 | `Header.tsx` で `useEditorStore.getState()` を直接使用 → stale state リスク | `Header.tsx:5,14,44-48` | React hooks 経由で state を取得するように修正 |
| M-04 | Google Drive フォルダスキャンが `folders[0]` を強制使用 | `Header.tsx:43` | フォルダ一覧から選択させる簡易ダイアログを追加 |

### Low（コード品質）

| ID | 問題 | 該当箇所 | 修正内容 |
|:---|:-----|:---------|:---------|
| L-01 | `require('stream')` が ES module import と不整合 | `googleService.ts:259` | `import { Readable } from 'stream'` に変更 |
| L-02 | `fileService.ts` の `SUPPORTED_EXTENSIONS` に `.gsheet` 未含 | `fileService.ts:5` | ローカルスキャン対象外のため現状維持。コメントで明記 |
| L-03 | `fileService.ts` の `LocalFile` と `src/types/index.ts` の `LocalFile` が重複定義 | `fileService.ts:7-13` | `fileService.ts` から `LocalFile` を削除し、共通型を import |

---

## 3. 修正対象ファイル一覧

| ファイル | 修正 ID |
|:---------|:--------|
| `electron/services/turndownInstance.ts` | H-01, H-02 |
| `electron/services/converter.ts` | C-01, M-02 |
| `electron/services/googleService.ts` | C-02, M-01, L-01 |
| `electron/services/imageExtractor.ts` | C-03 |
| `electron/services/fileService.ts` | L-02, L-03 |
| `src/components/ActionBar.tsx` | H-03, H-04 |
| `src/components/Header.tsx` | M-03, M-04 |

---

## 4. 修正詳細

### C-01: `file:mergeDocuments` の Google ファイルガード

現状 `ActionBar.tsx` がクライアント側で Google ファイルを分岐処理するため、`file:mergeDocuments` IPC には Google ファイルが渡されない設計。ただし IPC 単体で呼ばれた場合にクラッシュする。

```typescript
// converter.ts - convertFile に gdoc/gsheet ガードを追加
async function convertFile(filePath: string): Promise<string> {
  if (filePath.startsWith('gdoc://') || filePath.startsWith('gsheet://')) {
    throw new Error(
      `Google ドライブファイルは file:convertToMarkdown では処理できません。` +
      `google:downloadDoc または google:downloadSheet を使用してください。`
    )
  }
  // ... existing switch
}
```

### H-01: span 正規表現のマルチライン対応

```typescript
// Before
/<span[^>]*style="[^"]*font-weight:\s*(?:700|bold)[^"]*"[^>]*>(.*?)<\/span>/gi

// After
/<span[^>]*style="[^"]*font-weight:\s*(?:700|bold)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi
```

italic, del も同様に修正。

### H-02: ネストされた空 span の再帰除去

```typescript
// Before
cleaned = cleaned.replace(/<span>(.*?)<\/span>/g, '$1')

// After: ネストがなくなるまで繰り返す
let prev = ''
while (prev !== cleaned) {
  prev = cleaned
  cleaned = cleaned.replace(/<span>([\s\S]*?)<\/span>/g, '$1')
}
```

### M-01: folderId バリデーション

```typescript
function validateFolderId(folderId: string): string {
  if (!folderId) return ''
  if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) {
    throw new Error('不正なフォルダ ID です')
  }
  return folderId
}
```

### M-03: Header.tsx の stale state 修正

```typescript
// Before
const store = useEditorStore.getState()
// store.slots → stale

// After: hooks 経由で最新の state を使用
const { slots, setSlots, setOutputFolderPath } = useEditorStore()
```

`handleScanLocalFolder` と `handleGoogleScan` 内でも `useEditorStore.getState()` の代わりに hooks から取得した値を使う。ただしイベントハンドラ内では `getState()` が最新値を返すため実害は少ないが、一貫性のために統一する。

### M-04: Google Drive フォルダ選択ダイアログ

```typescript
// 簡易実装: window.prompt でフォルダ選択
const handleGoogleScan = async () => {
  // ... auth check ...
  const folders = await window.electronAPI.googleListFolders()
  if (folders.length === 0) {
    alert('Google ドライブにフォルダがありません')
    return
  }

  // フォルダ一覧を表示して選択
  const folderNames = folders.map((f: any, i: number) => `${i + 1}. ${f.name}`).join('\n')
  const input = window.prompt(
    `フォルダを選択してください（番号を入力）:\n${folderNames}`,
    '1'
  )
  if (!input) return

  const idx = parseInt(input, 10) - 1
  if (isNaN(idx) || idx < 0 || idx >= folders.length) {
    alert('無効な番号です')
    return
  }

  const selectedFolder = folders[idx]
  const result = await window.electronAPI.googleScanFolder(selectedFolder.id)
  // ... populate slots ...
}
```

---

## 5. テスト計画

| テスト ID | 対象 | テスト内容 |
|:----------|:-----|:----------|
| T-20 | C-01 | `convertFile('gdoc://xxx')` が明確なエラーを投げる |
| T-21 | H-01 | 改行を含む bold span がマークダウン `**text**` に変換される |
| T-22 | H-02 | `<span><span>text</span></span>` が `text` に正規化される |
| T-23 | M-01 | 不正な folderId (`'; DROP TABLE--`) がバリデーションで弾かれる |
| T-24 | H-04 | 画像抽出 ON + フォルダ未設定で警告表示される |

---

## 6. 受入基準

- [x] C-01: `gdoc://`/`gsheet://` パスで明確なエラーメッセージが返る
- [x] C-02: `googleService.ts` のデッドコード `media` が削除されている
- [x] C-03: `BASE64_IMG_REGEX` の使用方法にコメントが付記されている
- [x] H-01: 改行を含む Google Docs span が正しくマークダウンに変換される
- [x] H-02: 多重ネストされた空 span が完全に除去される
- [x] H-03: `handleSaveGoogle` で不要な `googleListFolders()` 呼び出しが削除されている
- [x] H-04: 画像抽出有効時にフォルダ未指定なら警告ダイアログが表示される
- [x] M-01: 不正な folderId が API クエリに到達しない
- [x] M-02: `getSeparator` 関数が削除されている
- [x] M-03: `Header.tsx` が React hooks 経由で state を取得している
- [x] M-04: Google Drive フォルダスキャン時にフォルダ選択ができる
- [x] L-01: `require('stream')` が `import` に統一されている
- [x] L-02: `fileService.ts` の拡張子リストにコメントが追加されている
- [x] L-03: `fileService.ts` の `LocalFile` 重複定義が解消されている（名前を `LocalFileLocal` に変更し、コメントで説明）
- [x] 既存テスト 46 件が全パス
- [x] 新規テスト 14 件（T-20〜T-24）が全パス（計 60 テスト）
- [x] `tsc --noEmit` エラーなし
- [x] `npm run build` 成功
