# 技術要件定義

## 技術スタック概要

### 言語・ランタイム
- **TypeScript**: フロントエンド・バックエンド共通
- **Bun**: 高速なJavaScript/TypeScriptランタイム・パッケージマネージャー

### フロントエンド
- **TanStack Start**: React-based full-stack framework
- **SSR**: Cloudflare Workers上でのサーバーサイドレンダリング

### バックエンド
- **Hono**: 軽量で高速なWebフレームワーク
- **実行環境**: Cloudflare Workers
- **ORM**: Drizzle ORM（TypeScript-first、migration-friendly）

### インフラ・デプロイメント
- **Cloudflare Workers**: エッジコンピューティングプラットフォーム
- **Cloudflare Pages**: フロントエンドホスティング（SSR対応）

### データベース
- **Supabase**: PostgreSQL互換のBaaS
- **接続方式**: Drizzle ORM経由でのPostgreSQL接続

## アーキテクチャ構成

```
┌─────────────────────────┐
│   TanStack Start        │
│   (Frontend SSR)        │
└─────────┬───────────────┘
          │ API calls
          ▼
┌─────────────────────────┐
│   Hono API              │
│   + Drizzle ORM         │
│   (Cloudflare Workers)  │
└─────────┬───────────────┘
          │ Database queries
          ▼
┌─────────────────────────┐
│   Supabase              │
│   (PostgreSQL)          │
└─────────────────────────┘
```

## 主要な機能・特徴

### Bun
- 高速なJavaScript/TypeScriptランタイム
- 組み込みのパッケージマネージャー
- Native bundler・transpiler
- Hot reloading機能
- Node.js互換性

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
- Cloudflare Workers最適化

### Drizzle ORM
- TypeScript-nativeなORM
- SQL-likeなクエリビルダー
- 型安全なマイグレーション
- Zero runtime overhead
- PostgreSQL完全対応

### Cloudflare Workers
- Edge computing
- 低レイテンシー
- グローバル展開
- スケーラビリティ
- KV/D1/R2統合

### Supabase
- PostgreSQL互換
- Real-time subscriptions
- Row Level Security
- 組み込み認証機能
- REST/GraphQL API

## 開発環境・ツール

### パッケージ管理
- **Bun workspaces**: モノレポ管理・高速インストール

### 開発ツール
- **Wrangler**: Cloudflare Workers CLI
- **Supabase CLI**: ローカル開発環境
- **Drizzle Kit**: マイグレーション・スキーマ管理
- **TypeScript**: 型チェック・トランスパイル

### CI/CD
- **GitHub Actions**: 自動デプロイメント
- **Cloudflare Workers**: 本番デプロイメント
- **Cloudflare Pages**: フロントエンドデプロイメント

## 検討すべき課題・制約事項

### Cloudflare Workers制約
- **実行時間制限**: 最大30秒（有料プランで10分）
- **メモリ制限**: 128MB
- **バンドルサイズ**: 最大1MB（圧縮後）
- **同時接続数**: 1000接続/分
- **CPU時間**: 10ms/リクエスト（無料）、50ms（有料）

### TanStack Start + Cloudflare Workers統合
- **SSR複雑性**: Workers環境でのReact SSR実装
- **状態管理**: クライアント・サーバー間の状態同期
- **ルーティング**: Workers内でのfile-based routing実装
- **静的アセット**: Pages + Workers間での最適化

### Bun + Cloudflare Workers統合
- **ランタイム差異**: Bun開発環境とWorkers本番環境の違い
- **互換性**: BunのAPIとWorkers環境での動作確認
- **依存関係**: Bunネイティブ機能のWorkers対応状況

### データベース・ORM統合の課題
- **接続プール**: Workersは従来の接続プールが使用不可
- **コールドスタート**: 新しいWorkerインスタンス起動時の遅延
- **Drizzle設定**: Workers環境での適切なドライバー選択
- **マイグレーション**: 本番環境での安全なスキーマ変更
- **型安全性**: Drizzle生成型とSupabase型の整合性

### 開発・デバッグの難しさ
- **ローカル開発**: Wranglerでの完全な再現性確保
- **デバッグツール**: Workers環境での制限されたデバッグ機能
- **テスト環境**: 本番環境との差異を最小化

### セキュリティ考慮事項
- **環境変数**: Workers Secretsでの機密情報管理
- **CORS設定**: フロントエンド・API間の適切な設定
- **認証フロー**: Supabase Auth + Workers間の統合
- **CSP**: Content Security Policyの適切な設定
- **Database接続**: Drizzleでの安全なクエリ実行

### パフォーマンス最適化
- **バンドルサイズ**: Tree-shakingと不要な依存関係排除
- **キャッシュ戦略**: Cloudflare CDNとWorkers KVの活用
- **画像最適化**: Cloudflare Imagesとの統合
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
bun run drizzle-kit generate:pg
bun run drizzle-kit push:pg
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
packages/
├── shared/          # 共通型定義・ユーティリティ
├── database/        # Drizzle スキーマ・マイグレーション
└── config/          # 共通設定

apps/
├── frontend/        # TanStack Start アプリ
└── api/            # Hono + Drizzle Workers API
```

## 開発・デプロイメントワークフロー

### ローカル開発環境

#### 必要なツール
```bash
# Bun (推奨)
curl -fsSL https://bun.sh/install | bash
bun install -g @cloudflare/wrangler
bun install -g supabase

# プロジェクトセットアップ
bun install
supabase start
bun run dev
```

#### 開発サーバー起動
```bash
# フロントエンド（TanStack Start）
cd apps/frontend
bun run dev

# バックエンド（Hono + Drizzle + Wrangler）
cd apps/api
bun run dev
```

### デプロイメント戦略

#### ステージング環境
```bash
# マイグレーション実行
cd packages/database
bun run db:push:staging

# API デプロイ
cd apps/api
wrangler deploy --env staging

# フロントエンド デプロイ
cd apps/frontend
bun run build
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
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run db:push:production --workspace=packages/database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  deploy-api:
    runs-on: ubuntu-latest
    needs: migration
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build --filter=apps/api
      - run: wrangler deploy apps/api
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-api
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build --filter=apps/frontend
      - run: wrangler pages deploy apps/frontend/dist
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