# Release v1.2.0

## 概要

Google OAuth 認証フローの修正と Linux プラットフォーム対応を強化したリリースです。

## 変更内容

### バグ修正

- **Google スキャンエラーの修正** — Electron で未対応の `window.prompt()` をカスタムモーダルダイアログに置換。Google ドライブのフォルダ選択が全プラットフォームで正常に動作するようになりました。

### ドキュメント

- **Google OAuth セットアップガイドの追加** (`docs/GOOGLE_OAUTH_SETUP.md`) — 403 `access_denied` エラーの解決方法、テストユーザーの登録手順、credentials.json の設定方法をまとめたトラブルシューティングガイド。
- **README にテストユーザー登録手順を追加** — Google Workspace 連携設定セクションに「手順 5: テストユーザーの登録」を追加。

### ビルド・インフラ

- **Linux ビルドをリリースワークフローに追加** — GitHub Actions で macOS / Windows / Linux の全プラットフォームビルドを自動化。
- **Linux ビルドスクリプトの有効化** — `npm run build:linux` で `.AppImage` を生成可能に。

## ダウンロード

| OS | ファイル |
|:---|:---------|
| macOS (Apple Silicon) | `Doc-to-Markdown Editor-1.2.0-arm64.dmg` |
| Windows (x64) | `Doc-to-Markdown Editor Setup 1.2.0.exe` |
| Linux (x64) | `Doc-to-Markdown Editor-1.2.0.AppImage` |

## アップグレード方法

新しいインストーラーをダウンロードして上書きインストールしてください。設定ファイルや認証トークンは引き継がれます。

## 既知の制限事項

- Google OAuth 同意画面が「Testing」状態の場合、登録済みテストユーザーのみ認証可能です。詳細は [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) を参照してください。
