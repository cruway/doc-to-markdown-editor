# SPEC-004: 2次コードレビュー指摘事項の修正計画

## メタ情報

| 項目 | 値 |
|:-----|:---|
| SPEC ID | SPEC-004 |
| 作成日 | 2026-03-08 |
| ステータス | Done |
| 優先度 | High |
| 前提 SPEC | SPEC-001, SPEC-002, SPEC-003 |

---

## 1. 目的

SPEC-003 修正後の2次全体レビューで検出された問題を優先度別に修正する。
実用的インパクトの高い項目に絞り、Phase 1（セキュリティ・安定性）→ Phase 2（テスト・CI）→ Phase 3（コード品質）の順で対応する。

---

## 2. Phase 1: セキュリティ・安定性（16件）

### P1-01: IPC ハンドラ一括 try-catch（Critical）
**対象**: `converter.ts`, `fileService.ts`, `googleService.ts`
すべての `ipcMain.handle` コールバックに try-catch を追加し、エラーを `{ error: string }` 形式で返す。

### P1-02: `app.whenReady()` エラーハンドリング（Critical）
**対象**: `main.ts:41`
`.catch()` を追加し、初期化失敗時にログ出力＋ダイアログ表示。

### P1-03: `file:saveToPath` パス検証（High）
**対象**: `fileService.ts:106-109`
`path.resolve()` + `path.relative()` で出力フォルダ配下に制限。

### P1-04: `JSON.parse` エラーハンドリング（High）
**対象**: `googleService.ts:50,59`
credentials.json / token.json の JSON.parse を try-catch で囲む。

### P1-05: 画像抽出 outputDir 検証（High）
**対象**: `imageExtractor.ts:19,44`
`path.resolve()` で正規化し、相対パス攻撃を防止。

### P1-06: 画像ディレクトリ作成の改善（High）
**対象**: `imageExtractor.ts:29-31,55-57`
replace コールバック外で事前にディレクトリ作成。

### P1-07: HTTP サーバー error 時の close（Medium）
**対象**: `googleService.ts:101-107`
エラーハンドラ内で `server.close()` を追加。

### P1-08: 未使用 import 削除（Medium）
**対象**: `main.ts:1`
`ipcMain`, `dialog`, `fs` を削除。

### P1-09: Frontend `catch (err: any)` 型安全化（Critical）
**対象**: `ActionBar.tsx:68,88,115`
`err instanceof Error ? err.message : String(err)` パターンに統一。

### P1-10: SlotCard JSON.parse try-catch（Critical）
**対象**: `SlotCard.tsx:23`
ドラッグデータ解析を try-catch で保護。

### P1-11: Header ボタン ローディング状態（Critical）
**対象**: `Header.tsx`, `editorStore.ts`
`isScanning` 状態を追加し、スキャン中はボタン無効化。

### P1-12: store moveFile non-null assertion 除去（Medium）
**対象**: `editorStore.ts:71-72`
`!` → ガード節に変更。

### P1-13: SlotCard key 改善（High）
**対象**: `SlotCard.tsx:74`
`key={file.path}` → `key={\`${slot.type}-${index}-${file.path}\`}`

### P1-14: 出力ファイル名バリデーション（Medium）
**対象**: `FileOperations.tsx:20`
不正文字 (`/\\:*?"<>|`) をサニタイズ。

### P1-15: `any` 型の改善（Medium）
**対象**: `preload.ts:13`, `types/index.ts:50-51`, `googleService.ts:35,256`
Google API 用の型定義を追加。

### P1-16: SlotCard classList → React state（Low）
**対象**: `SlotCard.tsx:40,44`
`classList.add/remove` → `useState` で管理。

---

## 3. Phase 2: テスト・CI（5件）

### P2-01: CI に テストステップ追加（Critical）
**対象**: `.github/workflows/ci.yml`
`npm test` をビルド前に追加。

### P2-02: vitest カバレッジ設定（High）
**対象**: `vitest.config.ts`
v8 カバレッジプロバイダーを設定。

### P2-03: converter ハンドラテスト（Critical）
**対象**: 新規 `converter.test.ts` (拡張)
`convertFile` の各フォーマット、ガード、mergeDocuments ロジックのテスト。

### P2-04: fileService テスト（Critical）
**対象**: 新規 `fileService.test.ts`
`classifySlot`、パス検証のテスト。

### P2-05: 未実装ツールバーボタン削除（Medium）
**対象**: `MarkdownEditor.tsx:92-103`
機能未実装のボタンを削除。

---

## 4. 修正対象ファイル一覧

| ファイル | 修正 ID |
|:---------|:--------|
| `electron/main.ts` | P1-02, P1-08 |
| `electron/preload.ts` | P1-15 |
| `electron/services/converter.ts` | P1-01 |
| `electron/services/fileService.ts` | P1-01, P1-03, P2-04 |
| `electron/services/googleService.ts` | P1-01, P1-04, P1-07, P1-15 |
| `electron/services/imageExtractor.ts` | P1-05, P1-06 |
| `src/types/index.ts` | P1-15 |
| `src/stores/editorStore.ts` | P1-11, P1-12 |
| `src/components/ActionBar.tsx` | P1-09 |
| `src/components/Header.tsx` | P1-11 |
| `src/components/SlotCard.tsx` | P1-10, P1-13, P1-16 |
| `src/components/FileOperations.tsx` | P1-14 |
| `src/components/MarkdownEditor.tsx` | P2-05 |
| `.github/workflows/ci.yml` | P2-01 |
| `vitest.config.ts` | P2-02 |
| `electron/services/__tests__/converter.test.ts` | P2-03 |
| `electron/services/__tests__/fileService.test.ts` | P2-04 |

---

## 5. 受入基準

- [x] P1-01: IPC ハンドラ一括 try-catch（converter, fileService, googleService）
- [x] P1-02: app.whenReady() エラーハンドリング + 未使用 import 削除
- [x] P1-03: file:saveToPath パス検証
- [x] P1-04: JSON.parse エラーハンドリング（credentials, token）
- [x] P1-05: 画像抽出 outputDir 正規化
- [x] P1-06: 画像ディレクトリ事前作成（replace 外に移動）
- [x] P1-07: HTTP サーバー error 時の close
- [x] P1-08: main.ts 未使用 import 削除
- [x] P1-09: Frontend catch (err: any) → instanceof Error パターン
- [x] P1-10: SlotCard JSON.parse try-catch
- [x] P1-11: Header ボタン isScanning ローディング状態
- [x] P1-12: store moveFile non-null assertion 除去
- [x] P1-13: SlotCard key 改善
- [x] P1-14: 出力ファイル名バリデーション
- [x] P1-15: any 型改善（OAuth2Client, DriveFileMetadata, GoogleDriveFolder 等）
- [x] P1-16: SlotCard classList → React state
- [x] P2-01: CI にテストステップ追加
- [x] P2-02: vitest カバレッジ設定
- [x] P2-03: converter ハンドラテスト（7件）
- [x] P2-04: fileService classifySlot テスト（15件）
- [x] P2-05: 未実装ツールバーボタン削除
- [x] 全 82 テストパス（既存 60 + 新規 22）
- [x] `tsc --noEmit` エラーなし
- [x] `npm run build` 成功
