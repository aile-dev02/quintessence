# TestMemo - QA ナレッジ管理ツール

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/aile-dev02/quintessence)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue)](https://reactjs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-79%25-green)](./coverage/index.html)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple)](https://web.dev/progressive-web-apps/)

**TestMemo** は、QAチームや専門家向けに設計されたモダンで包括的なメモ・ナレッジ管理アプリケーションです。React 19、TypeScript等で構築され、品質保証に関するナレッジの整理、検索、共有のためのプラットフォームです。

## 機能

### 基本機能
- **リッチメモ管理**: リッチテキスト対応でメモの作成、編集、削除、整理が可能
- **高度な検索**: タイトル、コンテンツ、タグ全体でのファジーマッチング付き全文検索
- **スマートタグシステム**: 階層的タグとフィルタリングでメモを整理
- **優先度管理**: より良い整理のための優先度レベル設定（低、中、高、重要）
- **ステータス追跡**: メモステータスの追跡（下書き、公開済み、アーカイブ済み）
- **レスポンシブデザイン**: デスクトップ、タブレット、モバイルに最適化された完全レスポンシブインターフェース

### 高度な機能
- **永続ストレージ**: オフライン機能のためのIndexedDBサポート付きローカルストレージ
- **リアルタイム更新**: コンポーネント間での即座の更新と同期
- **PWAサポート**: オフライン機能付きプログレッシブWebアプリ
- **アクセシビリティ**: 完全なキーボードナビゲーション付きWCAG 2.1 AA準拠

## 技術スタック

### フロントエンド
- **React 19.1.1**
- **TypeScript 5.9.3**
- **Tailwind CSS 4.1.16**
- **Heroicons 2.2.0**

### ステート管理とデータ
- **カスタムフック** - ステート管理とデータフェッチング用のReactフック
- **IndexedDB/Dexie 4.2.1** - 永続ストレージ用のクライアントサイドデータベース
- **Fuse.js 7.1.0** - 強力なファジー検索機能

### 開発とテスト
- **Vite 7.1.7**
- **Vitest 4.0.2**
- **Playwright 1.56.1**
- **ESLint 9.36.0**

##  インストール



### クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/aile-dev02/quintessence.git
cd quintessence

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:5173 を開く
```

### 開発コマンド

```bash
# 開発
npm run dev          # HMR付き開発サーバーを起動
npm run build        # 本番用ビルド
npm run preview      # 本番ビルドをローカルでプレビュー

# テスト
npm run test         # ユニットテストを実行
npm run test:coverage # カバレッジレポートを生成
npm run test:e2e     # エンドツーエンドテストを実行

# コード品質
npm run lint         # ESLintを実行
```

##  プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── MemoForm.tsx    # メモ作成/編集フォーム
│   ├── MemoList.tsx    # フィルタリング付きメモ一覧
│   ├── MemoDetail.tsx  # 個別メモ表示
│   └── SearchAndFilterBar.tsx # 検索とフィルターコントロール
├── models/             # ビジネスロジックとデータモデル
│   └── Memo.ts         # バリデーション付きコアメモモデル
├── services/           # データアクセスとビジネスサービス
│   ├── MemoService.ts  # メモ操作のメインサービス
│   └── storage/        # ストレージ抽象化レイヤー
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数とヘルパー
├── App.tsx             # メインアプリケーションコンポーネント
└── main.tsx            # アプリケーションエントリーポイント

tests/
├── models/             # モデルのユニットテスト
├── services/           # サービスのユニットテスト
└── e2e/                # エンドツーエンドテスト
```

##  テスト戦略

### ユニットテスト（47以上のテスト、79%カバレッジ）
- **メモモデル**: バリデーション、CRUD操作、検索機能をカバーする35のテスト
- **メモサービス**: サービス層とビジネスロジックをカバーする12のテスト
- **モックインフラストラクチャ**: localStorageとIndexedDBモックによる完全な分離

### カバレッジレポート
- **HTMLレポート**: `coverage/index.html` で利用可能
- **コンソール出力**: 詳細なステートメント、ブランチ、関数カバレッジ

##  デプロイ

### 本番ビルド

```bash
# 最適化された本番ビルドを作成
npm run build

# dist/ フォルダにすべてのデプロイファイルが含まれます
```

### デプロイオプション
- **Netlify**: 即座にデプロイするため `dist/` フォルダをドラッグ
- **Vercel**: 自動デプロイのためGitHubリポジトリを接続
- **GitHub Pages**: 静的ホスティングに使用
- **AWS S3 + CloudFront**: エンタープライズデプロイメント用

##  コントリビューション

1. リポジトリをフォーク
2. 機能ブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. プルリクエストを開く

### 開発ガイドライン
- TypeScriptストリクトモードに従う
- テストカバレッジを80%以上に維持
- アクセシビリティのベストプラクティスに従う
- セマンティックコミットメッセージを使用

##  パフォーマンス指標

- **バンドルサイズ**: 113.81 kB（gzip圧縮）
- **テストカバレッジ**: 79%（モデル）、45%（全体）
- **Lighthouseスコア**: 全カテゴリで95以上
- **PWA対応**: サービスワーカーとオフラインサポート

---

*最終更新: 2025年10月27日*
