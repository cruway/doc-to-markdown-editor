# Doc-to-Markdown 統合エディタ

複数のドキュメントファイルを「**起・承・転・結**」の構成に沿って統合し、1つの Markdown ファイルとして出力するデスクトップアプリケーションです。

![Electron](https://img.shields.io/badge/Electron-40+-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## 機能概要

| 機能 | 説明 |
|:-----|:-----|
| **起承転結スロット** | 4つの構成枠にファイルをドラッグ＆ドロップで配置 |
| **自動分類** | フォルダスキャン時、ファイル名のキーワードで自動的にスロットへ振り分け |
| **ドキュメント変換** | `.docx` / `.html` / `.txt` / `.md` を Markdown に変換 |
| **Markdown エディタ** | CodeMirror 6 ベースのシンタックスハイライト付きエディタ |
| **ローカル保存** | 任意のフォルダに `.md` ファイルとして保存 |
| **Google Workspace 連携** | Google ドライブからファイル取得・保存が可能 |

---

## スクリーンショット

> Pencil で作成した UI デザインに基づいて構築されています。

```
┌──────────┬──────────────────────────────────────────┐
│          │  Doc-to-Markdown 統合エディタ             │
│ DOC2MD   │                                          │
│          │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ 統合      │  │ 起  │ │ 承  │ │ 転  │ │ 結  │        │
│ エディタ   │  └─────┘ └─────┘ └─────┘ └─────┘        │
│ ファイル管理│                                          │
│ 設定      │  ┌─ Markdown エディタ ─────────────────┐ │
│          │  │ # 起：イントロダクション               │ │
│          │  │ ...                                  │ │
│          │  └──────────────────────────────────────┘ │
│          │        [統合実行]  [保存]  [Google Drive]  │
└──────────┴──────────────────────────────────────────┘
```

---

## 対応プラットフォーム

| OS | 対応状況 | インストーラー |
|:---|:---------|:-------------|
| **macOS** (Apple Silicon) | 対応 | `.dmg` |
| **Windows** (x64) | 対応 | `.exe` (NSIS) |
| **Linux** (x64 / ARM64) | 対応 | `.AppImage` |

---

## 必要環境

### リリース版を使う場合

- **macOS** 12 (Monterey) 以上
- **Windows** 10 以上
- **Linux** — Fedora 38+、Ubuntu 22.04+、Bazzite、その他 glibc 2.31 以上のディストリビューション
- インターネット接続は不要（Google Workspace 連携を使う場合のみ必要）

### ソースからビルドする場合

- **Node.js** 20 以上
- **npm** 10 以上

---

## インストール・セットアップ

### リリース版（推奨）

[Releases](https://github.com/cruway/doc-to-markdown-editor/releases) ページから、お使いの OS に対応したインストーラーをダウンロードしてください。

| OS | ファイル |
|:---|:---------|
| macOS (Apple Silicon) | `Doc-to-Markdown Editor-x.x.x-arm64.dmg` |
| Windows | `Doc-to-Markdown Editor Setup x.x.x.exe` |
| Linux (x64) | `Doc-to-Markdown Editor-x.x.x.AppImage` |
| Linux (ARM64) | `Doc-to-Markdown Editor-x.x.x-arm64.AppImage` |

#### Linux での起動方法

```bash
# 実行権限を付与
chmod +x "Doc-to-Markdown Editor-x.x.x.AppImage"

# 起動
./"Doc-to-Markdown Editor-x.x.x.AppImage"
```

> **Bazzite / Fedora Kinoite などの不変 OS の場合**: AppImage はホームディレクトリ内で直接実行できます。Flatpak への変換は不要です。

> **Windows の注意**: 未署名のアプリのため、初回起動時に SmartScreen の警告が表示される場合があります。「詳細情報」→「実行」で起動できます。

### ソースからビルド

```bash
# リポジトリをクローン
git clone https://github.com/cruway/doc-to-markdown-editor.git
cd doc-to-markdown-editor

# 依存パッケージをインストール
npm install

# 開発モードで起動
npm run dev

# プロダクションビルド
npm run build

# パッケージング
npm run build:mac    # macOS (.dmg)
npm run build:win    # Windows (.exe)
npm run build:linux  # Linux (.AppImage)
```

---

## 使い方

### 1. ファイルの取得・配置

#### ローカルファイルの場合

1. 画面右上の **「ローカル取得」** ボタンをクリック
2. ドキュメントが格納されたフォルダを選択
3. ファイル名に「起」「承」「転」「結」のキーワードが含まれている場合、自動的に対応するスロットに配置されます

#### Google ドライブの場合

1. 画面右上の **「Google ドライブから取得」** ボタンをクリック
2. 初回はブラウザで Google アカウント認証が開きます
3. 認証後、Google ドライブ内の Google ドキュメントがスキャンされ、自動分類されます

### 2. 構成の調整

- **ファイルの追加**: 各スロット下部の **「ファイルを追加」** をクリック
- **ファイルの移動**: ファイル名をドラッグして別のスロットにドロップ
- **ファイルの削除**: ファイル名にホバーし、✕ボタンをクリック

### 3. 統合実行

1. 画面下部の **「統合実行（プレビュー）」** ボタンをクリック
2. 起 → 承 → 転 → 結 の順序でファイルが Markdown に変換・統合されます
3. 結果が Markdown エディタに表示されます

### 4. 編集

- エディタ内で直接テキストを編集できます
- ツールバーのアイコンで **太字**、*斜体*、見出し、リストの書式を適用できます

### 5. 保存

#### ローカル保存

1. **「出力ファイル名」** と **「保存先フォルダ」** を設定
2. **「ローカルに保存」** ボタンをクリック

#### Google ドライブ保存

1. **「Google ドライブへ保存」** ボタンをクリック
2. Google ドライブのルートフォルダに `.md` ファイルとして保存されます

---

## Google Workspace 連携設定

Google ドライブとの連携を使用するには、OAuth 2.0 認証情報の設定が必要です。ローカルファイルのみ使用する場合はこの設定は不要です。

### 手順 1: Google Cloud Console でプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）

### 手順 2: API の有効化

**APIs & Services > Library** から以下の API を有効にします:

- **Google Drive API**
- **Google Docs API**
- **Google Sheets API**

### 手順 3: OAuth 2.0 認証情報の作成

1. **APIs & Services > Credentials** に移動
2. **Create Credentials > OAuth client ID** を選択
3. アプリケーションの種類: **デスクトップアプリ**
4. 作成後、**JSON をダウンロード**

### 手順 4: credentials.json の配置

ダウンロードした JSON ファイルを `credentials.json` にリネームし、以下のパスに配置します:

| OS | 配置先 |
|:---|:-------|
| **macOS** | `~/Library/Application Support/doc-to-markdown-editor/google-auth/credentials.json` |
| **Windows** | `%APPDATA%\doc-to-markdown-editor\google-auth\credentials.json` |
| **Linux** | `~/.config/doc-to-markdown-editor/google-auth/credentials.json` |

#### Linux での配置例

```bash
# ディレクトリを作成
mkdir -p ~/.config/doc-to-markdown-editor/google-auth/

# ダウンロードした JSON をコピー（ファイル名はダウンロード時に異なります）
cp ~/Downloads/client_secret_XXXXX.json \
   ~/.config/doc-to-markdown-editor/google-auth/credentials.json
```

#### macOS での配置例

```bash
mkdir -p ~/Library/Application\ Support/doc-to-markdown-editor/google-auth/
cp ~/Downloads/client_secret_XXXXX.json \
   ~/Library/Application\ Support/doc-to-markdown-editor/google-auth/credentials.json
```

> **注意**: `credentials.json` は秘密情報です。Git にコミットしたり、他の人と共有しないでください。

> **Windows の注意**: ファイアウォールが OAuth コールバック用のポート (3333) をブロックする場合があります。認証が失敗する場合は、Windows ファイアウォールの設定でこのアプリの通信を許可してください。

---

## 対応ファイル形式

| 形式 | 変換方法 |
|:-----|:---------|
| `.docx` | mammoth.js → HTML → turndown → Markdown |
| `.html` | turndown → Markdown |
| `.md` | そのまま統合 |
| `.txt` | そのまま統合 |
| Google ドキュメント | Docs API → HTML → turndown → Markdown |

---

## 自動分類キーワード

フォルダスキャン時、以下のキーワードがファイル名に含まれていると自動分類されます。

| スロット | キーワード |
|:---------|:-----------|
| 起 | `起`, `intro`, `opening` |
| 承 | `承`, `body`, `main` |
| 転 | `転`, `twist`, `turn` |
| 結 | `結`, `conclusion`, `ending` |

---

## 技術スタック

| レイヤー | 技術 |
|:---------|:-----|
| デスクトップ | Electron 40+ |
| フロントエンド | React 19 + TypeScript |
| ビルド | Vite + vite-plugin-electron |
| UI | Tailwind CSS 4 |
| D&D | @dnd-kit |
| エディタ | CodeMirror 6 |
| 変換 | mammoth.js + turndown |
| 状態管理 | Zustand |
| Google 連携 | googleapis + google-auth-library |
| パッケージング | electron-builder |

---

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動（ホットリロード）
npm run build        # プロダクションビルド
npm run build:mac    # macOS 用パッケージング (.dmg)
npm run build:win    # Windows 用パッケージング (.exe)
npm run build:linux  # Linux 用パッケージング (.AppImage)
```

---

## プラットフォーム別の注意事項

### macOS

- macOS ネイティブのタイトルバー統合（信号ボタン対応）
- `.dmg` を開いてアプリを Applications フォルダにドラッグ

### Windows

- メニューバーは自動で非表示になります
- 未署名アプリのため、SmartScreen 警告が出る場合があります
- Google OAuth 認証時にファイアウォールの許可が必要な場合があります
- `%APPDATA%` 配下に設定ファイルが保存されます

### Linux

- AppImage 形式で配布されます。実行権限を付与してから起動してください
- Bazzite、Fedora Kinoite などの不変 OS でもホームディレクトリ内から直接実行できます
- NVIDIA GPU を使用している場合、Electron は自動的にハードウェアアクセラレーションを利用します
- 設定ファイルは `~/.config/doc-to-markdown-editor/` に保存されます

---

## ライセンス

ISC
