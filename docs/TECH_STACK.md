# Doc-to-Markdown 統合エディタ — 技術スタック選定

## 選定方針

インターネット接続不要で動作するデスクトップアプリケーションとして構築する。
ローカルファイルシステム上の `.docx`（Google Docs からエクスポート）や
その他のドキュメントファイルを読み込み、Markdown へ変換・統合する。

---

## 技術スタック

| レイヤー | 技術 | 選定理由 |
|:---------|:-----|:---------|
| **デスクトップフレームワーク** | Electron 33+ | クロスプラットフォーム対応（Mac/Win/Linux）。Node.js API でファイル操作可能 |
| **フロントエンド** | React 19 + TypeScript | コンポーネントベースの UI 構築。型安全 |
| **ビルドツール** | Vite + electron-vite | 高速ビルド。Electron 向け最適化済み |
| **UI ライブラリ** | Tailwind CSS 4 + shadcn/ui | ユーティリティファーストCSS。デザイントークンとの親和性 |
| **D&D** | @dnd-kit/core | React 向け D&D ライブラリ。アクセシビリティ対応 |
| **Markdown エディタ** | CodeMirror 6 | 軽量・高性能。Markdown シンタックスハイライト対応 |
| **DOCX → MD 変換** | mammoth.js + turndown | `.docx` → HTML → Markdown の2段階変換 |
| **ファイル操作** | Node.js fs / Electron dialog API | ローカルファイルの読み書き、フォルダ選択ダイアログ |
| **状態管理** | Zustand | 軽量。ボイラープレート最小 |
| **テスト** | Vitest + React Testing Library | Vite ネイティブのテストランナー |
| **パッケージング** | electron-builder | インストーラー生成（.dmg / .exe / .AppImage） |

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────┐
│                  Electron App                        │
│                                                      │
│  ┌─────────── Renderer Process ──────────────────┐  │
│  │                                                │  │
│  │  React + TypeScript                            │  │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  │  │
│  │  │ @dnd-kit  │  │ CodeMirror│  │ shadcn/ui │  │  │
│  │  │  (D&D)    │  │  (Editor) │  │  (UI)     │  │  │
│  │  └─────┬─────┘  └─────┬─────┘  └───────────┘  │  │
│  │        └──────┬───────┘                        │  │
│  │               │ IPC (contextBridge)            │  │
│  └───────────────┼────────────────────────────────┘  │
│                  ▼                                    │
│  ┌─────────── Main Process ──────────────────────┐  │
│  │                                                │  │
│  │  Node.js                                       │  │
│  │  ┌──────────────┐  ┌─────────────────────┐    │  │
│  │  │ fs / path    │  │ mammoth + turndown  │    │  │
│  │  │ (ファイル I/O)│  │ (DOCX → MD 変換)   │    │  │
│  │  └──────────────┘  └─────────────────────┘    │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 入力ファイル対応

| ファイル形式 | 変換方法 | 優先度 |
|:-------------|:---------|:-------|
| `.docx` | mammoth.js → HTML → turndown → MD | Must |
| `.html` | turndown → MD | Should |
| `.txt` | そのまま挿入 | Should |
| `.md` | そのまま挿入 | Must |
| `.gdoc` (エクスポート済み) | `.docx` として処理 | Should |

---

## 代替案と判断

| 検討した代替案 | 不採用理由 |
|:---------------|:-----------|
| Tauri (Rust) | Rust の学習コスト。Node.js エコシステムの mammoth.js 等を直接利用したい |
| Google Apps Script | オンライン必須。オフライン利用不可 |
| Python + PyQt | JS/TS エコシステム（CodeMirror, dnd-kit）の方がエディタUI構築に適している |
| Monaco Editor | CodeMirror の方が軽量。Electron でのバンドルサイズを抑えられる |
| react-beautiful-dnd | メンテナンス停止。@dnd-kit が後継として推奨 |

---

## 開発環境セットアップ

```bash
# プロジェクト作成
npm create @electron-vite/app@latest doc-to-markdown-editor -- --template react-ts

# 依存パッケージ
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @codemirror/lang-markdown @codemirror/view @codemirror/state
npm install mammoth turndown
npm install zustand
npm install tailwindcss @tailwindcss/vite

# 開発
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run preview      # ビルド結果プレビュー

# パッケージング
npm run build:mac    # macOS (.dmg)
npm run build:win    # Windows (.exe)
npm run build:linux  # Linux (.AppImage)
```

---

## ディレクトリ構成（予定）

```
doc-to-markdown-editor/
├── electron/
│   ├── main.ts              # Electron メインプロセス
│   ├── preload.ts            # IPC ブリッジ
│   └── services/
│       ├── fileService.ts    # ファイル読み書き
│       └── converter.ts     # DOCX → MD 変換
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── SlotPanel.tsx     # 起承転結スロット
│   │   ├── SlotCard.tsx      # 個別スロットカード
│   │   ├── FileOperations.tsx
│   │   ├── MarkdownEditor.tsx
│   │   └── ActionBar.tsx
│   ├── stores/
│   │   └── editorStore.ts    # Zustand ストア
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── markdown.ts
├── tests/
├── docs/
├── package.json
└── electron-builder.yml
```
