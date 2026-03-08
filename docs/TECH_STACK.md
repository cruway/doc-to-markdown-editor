# Doc-to-Markdown 統合エディタ — 技術スタック選定

## 選定方針

Google ドライブ / Google ドキュメントとの連携が必須要件であり、
GAS（Google Apps Script）をバックエンドとして利用することで
OAuth やサービスアカウント管理を最小化する。

---

## 技術スタック

| レイヤー | 技術 | 選定理由 |
|:---------|:-----|:---------|
| **ランタイム** | Google Apps Script (V8) | Google Workspace との直接連携。デプロイ・ホスティング不要 |
| **フロントエンド** | HTML5 / CSS3 / Vanilla JS | GAS の `HtmlService` で配信。フレームワーク不要でシンプル |
| **UI ライブラリ** | Sortable.js (v1.15+) | D&D による並び替え。CDN 経由で読み込み、GAS 環境で動作確認済み |
| **Markdown エディタ** | CodeMirror 6 (Basic Setup) | 軽量エディタ。Markdown シンタックスハイライト対応 |
| **Doc → MD 変換** | 独自変換ロジック (GAS) | Google Docs API の構造化データをパースし MD 記法へ変換 |
| **API** | Google Drive API v3 / Google Docs API v1 | GAS 組み込みサービス (`DriveApp`, `DocumentApp`) + Advanced Services |
| **テスト** | clasp + Jest (ローカル開発時) | GAS コードのユニットテスト |
| **開発ツール** | clasp (CLI) | GAS プロジェクトのローカル開発・バージョン管理 |

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────┐
│              Browser (HtmlService)               │
│                                                   │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Sortable  │  │ CodeMirror│  │  Custom CSS  │ │
│  │  (D&D)    │  │  (Editor) │  │              │ │
│  └─────┬─────┘  └─────┬─────┘  └──────────────┘ │
│        │              │                           │
│        └──────┬───────┘                           │
│               │ google.script.run                 │
├───────────────┼───────────────────────────────────┤
│               ▼                                   │
│        Google Apps Script (Server)                │
│                                                   │
│  ┌──────────────┐  ┌─────────────────────────┐   │
│  │  DriveApp /   │  │ Doc-to-Markdown 変換    │   │
│  │  Drive API v3 │  │ (DocumentApp → MD)      │   │
│  └──────────────┘  └─────────────────────────┘   │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 代替案と判断

| 検討した代替案 | 不採用理由 |
|:---------------|:-----------|
| React / Next.js + Google OAuth | GAS で十分。外部ホスティングとOAuth管理が追加コスト |
| Turndown (HTML→MD) | Google Docs の構造化データから直接変換する方が精度が高い |
| Monaco Editor | CodeMirror の方が軽量で GAS HtmlService との相性が良い |
| marked / remark | プレビュー用に将来追加可能。初期スコープでは不要 |

---

## 開発環境セットアップ

```bash
# clasp インストール
npm install -g @google/clasp

# ログイン
clasp login

# プロジェクト作成
clasp create --type webapp --title "Doc-to-Markdown Editor"

# ローカル開発
clasp pull   # GAS → ローカル
clasp push   # ローカル → GAS
clasp deploy # デプロイ
```
