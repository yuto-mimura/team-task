# 技術要件定義

## 技術スタック概要

### 言語・ランタイム
- **TypeScript**: フロントエンド・バックエンド共通
- **Bun**: 高速なJavaScript/TypeScriptランタイム・パッケージマネージャー

### フロントエンド
- **TanStack Start**: React-based full-stack framework
- **SSR**: サーバーサイドレンダリング（静的生成）

### バックエンド
- **Hono**: 軽量で高速なWebフレームワーク
- **実行環境**: AWS Lambda
- **ORM**: Drizzle ORM（TypeScript-first、migration-friendly）

### インフラ・デプロイメント
- **AWS Lambda**: サーバーレスバックエンド実行環境
- **Amazon S3**: 静的フロントエンドホスティング
- **Amazon CloudFront**: CDNによる配信最適化

### データベース
- **Supabase**: PostgreSQL互換のBaaS
- **接続方式**: Drizzle ORM経由でのPostgreSQL接続

## アーキテクチャ構成

```
┌─────────────────────────┐
│   TanStack Start        │
│   (Static Generation)   │
│   S3 + CloudFront       │
└─────────┬───────────────┘
          │ API calls
          ▼
┌─────────────────────────┐
│   Hono API              │
│   + Drizzle ORM         │
│   (AWS Lambda)          │
└─────────┬───────────────┘
          │ Database queries
          ▼
┌─────────────────────────┐
│   Supabase              │
│   (PostgreSQL)          │
└─────────────────────────┘
```

## 主要な機能・特徴

### TanStack Start
- File-based routing
- Server-side rendering
- Client-side hydration
- TypeScript標準サポート
- Build-time最適化

### Hono
- 軽量・高速なWebフレームワーク
- TypeScript first
- Middleware ecosystem
- Web標準API対応
- AWS Lambda最適化

### Drizzle ORM
- TypeScript-nativeなORM
- SQL-likeなクエリビルダー
- 型安全なマイグレーション
- Zero runtime overhead
- PostgreSQL完全対応

### AWS Lambda
- サーバーレスコンピューティング
- 自動スケーリング
- 従量課金モデル
- 高可用性
- AWS サービス統合

### Supabase
- PostgreSQL互換
- Real-time subscriptions
- Row Level Security
- 組み込み認証機能
- REST/GraphQL API

## 開発環境・ツール

### パッケージ管理
- **pnpm workspaces**: モノレポ管理・高速インストール

### 開発ツール
- **AWS CLI**: AWS サービス管理
- **AWS SAM CLI**: Lambda ローカル開発
- **Supabase CLI**: ローカル開発環境
- **Drizzle Kit**: マイグレーション・スキーマ管理
- **TypeScript**: 型チェック・トランスパイル

### CI/CD
- **GitHub Actions**: 自動デプロイメント
- **AWS Lambda**: バックエンドデプロイメント
- **Amazon S3 + CloudFront**: フロントエンドデプロイメント

## 検討すべき課題・制約事項

### AWS Lambda制約
- **実行時間制限**: 最大15分
- **メモリ制限**: 128MB～10,240MB
- **パッケージサイズ**: 最大50MB（圧縮後）、250MB（非圧縮）
- **同時実行数**: 1000同時実行（デフォルト）
- **一時ディスク領域**: 512MB～10,240MB

### TanStack Start + S3/CloudFront統合
- **静的サイト生成**: ビルド時の静的ファイル生成
- **ルーティング**: クライアントサイドルーティング
- **キャッシュ戦略**: CloudFrontでの配信最適化
- **アセット管理**: S3での静的ファイルホスティング

### Node.js/pnpm + Lambda統合
- **ランタイム環境**: Node.js 18+での一貫性
- **パッケージ管理**: pnpmでの依存関係最適化
- **ビルド最適化**: esbuildでのLambda向けバンドル

### データベース・ORM統合の課題
- **接続プール**: Lambdaは接続プールを使用できないためコネクション管理が重要
- **コールドスタート**: 新しいLambdaインスタンス起動時の遅延
- **Drizzle設定**: Lambda環境での適切なドライバー選択
- **マイグレーション**: 本番環境での安全なスキーマ変更
- **型安全性**: Drizzle生成型とSupabase型の整合性

### 開発・デバッグの難しさ
- **ローカル開発**: AWS SAMでのローカルLambdaシミュレーション
- **デバッグツール**: Lambda環境でのログ出力とCloudWatch統合
- **テスト環境**: 本番環境との差異を最小化

### セキュリティ考慮事項
- **環境変数**: Lambda環境変数とAWS Secrets Managerでの機密情報管理
- **CORS設定**: フロントエンド・API間の適切な設定
- **認証フロー**: Supabase Auth + Lambda間の統合
- **CSP**: Content Security Policyの適切な設定
- **Database接続**: Drizzleでの安全なクエリ実行

### パフォーマンス最適化
- **バンドルサイズ**: Tree-shakingと不要な依存関係排除
- **キャッシュ戦略**: CloudFront CDNとLambda@Edgeの活用
- **画像最適化**: S3とCloudFrontでの画像配信最適化
- **Code splitting**: TanStack Startでの効果的な分割
- **ORM最適化**: Drizzleでのクエリパフォーマンス向上

## 推奨される解決策・アプローチ

### Drizzle ORM設定
```typescript
// Drizzle configuration for Cloudflare Workers
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const sql = postgres(env.DATABASE_URL, {
  prepare: false,
  ssl: 'require'
})

const db = drizzle(sql)
```

### スキーマ定義・マイグレーション
```typescript
// schema/users.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})
```

```bash
# マイグレーション実行
pnpm run drizzle-kit generate:pg
pnpm run drizzle-kit push:pg
```

### 環境変数管理
```toml
# wrangler.toml
[vars]
SUPABASE_URL = "https://xxx.supabase.co"

[env.production.vars]
DATABASE_URL = "postgresql://user:pass@host:5432/db"
```

### モノレポ構成推奨
```
api/                 # Hono + Drizzle Workers API
frontend/            # TanStack Start アプリ
packages/            # 共有パッケージ（将来の拡張用）
├── shared/          # 共通型定義・ユーティリティ
├── database/        # Drizzle スキーマ・マイグレーション
└── config/          # 共通設定
```

## 開発・デプロイメントワークフロー

### ローカル開発環境

#### 必要なツール
```bash
# pnpm (推奨)
npm install -g pnpm @cloudflare/wrangler supabase

# プロジェクトセットアップ
pnpm install
supabase start
pnpm run dev
```

#### 開発サーバー起動
```bash
# フロントエンド（TanStack Start）
cd frontend
pnpm run dev

# バックエンド（Hono + Drizzle + Wrangler）
cd api
pnpm run dev
```

### デプロイメント戦略

#### ステージング環境
```bash
# マイグレーション実行
cd packages/database
pnpm run db:push:staging

# API デプロイ
cd api
wrangler deploy --env staging

# フロントエンド デプロイ
cd frontend
pnpm run build
wrangler pages deploy dist --env staging
```

#### 本番環境
```bash
# GitHub Actions経由での自動デプロイ
git push origin main
```

### CI/CD パイプライン例

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  migration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run db:push:production --filter=packages/database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy-api:
    runs-on: ubuntu-latest
    needs: migration
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run build --filter=api
      - run: wrangler deploy api
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-api
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run build --filter=frontend
      - run: wrangler pages deploy frontend/dist
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 次のステップ・実装順序

1. **プロジェクト初期化**: Bunワークスペース + モノレポ構造作成
2. **Drizzle設定**: スキーマ定義 + マイグレーションセットアップ
3. **Hono API**: 基本的なAPIエンドポイント + Drizzle統合
4. **Supabase統合**: PostgreSQL接続 + 認証設定
5. **TanStack Start**: フロントエンド基本構造 + API連携
6. **認証機能**: Supabase Auth + Workers統合
7. **デプロイメント**: CI/CDパイプライン構築
8. **最適化**: パフォーマンス・セキュリティ向上

## Drizzle ORMの優位性

### 簡単なマイグレーション
- **型安全**: TypeScriptスキーマから自動的にSQL生成
- **差分検出**: 自動的にスキーマ変更を検出
- **Zero-downtime**: 安全なマイグレーション戦略
- **ロールバック**: 簡単な巻き戻し機能

### 開発体験
- **IntelliSense**: 完全な型補完とエラー検出
- **SQL-like**: 学習コストが低いクエリビルダー
- **軽量**: ランタイムオーバーヘッドなし
- **Workers最適化**: Cloudflare Workers向けに設計