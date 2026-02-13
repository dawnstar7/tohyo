# TOHYO - AI Consensus Poll

AI搭載型の投票アプリケーション

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database/Auth**: Supabase
- **AI**: Vercel AI SDK

## Directory Structure

```
/app              # Pages and layouts (Next.js App Router)
/components       # UI components
  /ui             # shadcn/ui components
/lib              # Core functionality
  /supabase       # Supabase client configuration
  /types          # TypeScript type definitions
  /utils          # Utility functions
  database.ts     # Database CRUD operations
/hooks            # Custom React hooks
/supabase         # Database schema and migrations
  /migrations     # SQL migration files
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase and OpenAI API credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-api-key
```

3. Set up the database:
- Follow the instructions in [Database Setup](#database-setup) below

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Features

### 1. 意見収集フェーズ（Collecting）
- ルームを作成し、参加者から自由に意見を投稿
- リアルタイムで意見一覧を表示

### 2. AI分析・投票生成
- 管理者が「投票を開始」ボタンをクリック
- Vercel AI SDK (OpenAI GPT-4) が意見を分析
- 5つの具体的な選択肢と説明を自動生成
- 自動的に投票フェーズに移行

### 3. 投票フェーズ（Voting）
- AI生成された選択肢に投票
- リアルタイムで投票数・パーセンテージを表示
- ブラウザフィンガープリントによる重複投票防止

### 4. 結果表示（Closed）
- 投票を締め切り、最終結果を表示

## Components

shadcn/ui components included:
- Button
- Card
- Input
- Badge

## Database Setup

### Initial Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local` and add your credentials
3. Apply the database schema:
   - Open Supabase Dashboard → SQL Editor
   - Copy and run the SQL from `/supabase/migrations/001_initial_schema.sql`

See `/supabase/README.md` for detailed database documentation.

### Database Structure

- **rooms**: 投票ルーム（議題）
- **entries**: ユーザーの意見・生の声
- **polls**: AI生成の投票選択肢
- **votes**: 投票データ（重複投票防止機能付き）

### CRUD Operations

All database operations are available in `/lib/database.ts`:

```typescript
import { createRoom, getEntries, createVote } from '@/lib/database';

// Create a new room
const room = await createRoom({ title: '新しい議題', status: 'collecting' });

// Get entries for a room
const entries = await getEntries(room.id);

// Create a vote
await createVote({ poll_id: pollId, user_id_hash: userHash });
```

## How It Works

### Workflow

1. **Create Room**: ユーザーが議題を設定してルームを作成
2. **Collect Opinions**: 参加者が自由に意見を投稿（collecting状態）
3. **AI Analysis**: 管理者が「投票開始」をクリック
   - Server Action (`generatePollsAction`) が実行
   - すべての意見を取得し、AIに送信
   - GPT-4が意見を分析し、5つの選択肢を生成
   - 選択肢をデータベースに保存
   - ルームのステータスを `voting` に更新
4. **Vote**: 参加者が選択肢に投票
   - ブラウザフィンガープリントでユーザーを識別
   - 重複投票を防止
5. **Close**: 管理者が投票を締め切り、結果を確定

### AI Integration

AIによる意見分析は `/lib/ai/analyze.ts` で実装:

```typescript
import { analyzeEntriesAndGeneratePolls } from '@/lib/ai/analyze';

// 意見を分析して選択肢を生成
const result = await analyzeEntriesAndGeneratePolls(
  ['意見1', '意見2', '意見3'],
  '議題のタイトル'
);

// result.options には5つの選択肢が含まれる
// 各選択肢には option_text, explanation, related_opinions が含まれる
```

## File Structure

### Key Files

- `/app/[roomId]/page.tsx` - ルームページ（意見投稿・投票UI）
- `/app/actions/room.ts` - Server Actions（ルーム作成、意見投稿、投票など）
- `/lib/ai/analyze.ts` - AI分析ロジック
- `/lib/database.ts` - データベースCRUD操作
- `/components/voting-panel.tsx` - 投票UIコンポーネント
- `/components/admin-controls.tsx` - 管理者操作UIコンポーネント

## License

ISC
