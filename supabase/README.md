# Supabase Database Setup

TOHYOアプリのデータベーススキーマとセットアップ手順

## データベース構造

### テーブル一覧

1. **rooms** - 投票ルーム
   - `id` (UUID): 主キー
   - `title` (TEXT): 議題名
   - `status` (ENUM): ステータス ('collecting' | 'voting' | 'closed')
   - `created_at` (TIMESTAMP): 作成日時
   - `updated_at` (TIMESTAMP): 更新日時

2. **entries** - ユーザーの意見・生の声
   - `id` (UUID): 主キー
   - `room_id` (UUID): ルームID (外部キー → rooms)
   - `content` (TEXT): 意見内容
   - `created_at` (TIMESTAMP): 作成日時

3. **polls** - AI生成の投票選択肢
   - `id` (UUID): 主キー
   - `room_id` (UUID): ルームID (外部キー → rooms)
   - `option_text` (TEXT): 選択肢のテキスト
   - `explanation` (TEXT): AIによる説明
   - `created_at` (TIMESTAMP): 作成日時

4. **votes** - 投票データ
   - `id` (UUID): 主キー
   - `poll_id` (UUID): 投票選択肢ID (外部キー → polls)
   - `user_id_hash` (TEXT): ユーザーIDのハッシュ（重複投票防止用）
   - `created_at` (TIMESTAMP): 作成日時
   - UNIQUE制約: (poll_id, user_id_hash)

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトのURL と anon key を取得

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. スキーマの適用

#### オプション A: Supabase Dashboard (推奨)

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 左サイドバーから「SQL Editor」を選択
4. `supabase/migrations/001_initial_schema.sql`の内容をコピー&ペースト
5. 「Run」をクリックして実行

#### オプション B: Supabase CLI

Supabase CLIがインストールされている場合:

```bash
# Supabase CLIのインストール (macOS)
brew install supabase/tap/supabase

# プロジェクトの初期化
supabase init

# ローカル開発環境の起動
supabase start

# マイグレーションの適用
supabase db push

# リモートプロジェクトへの適用
supabase link --project-ref your-project-ref
supabase db push
```

### 4. Row Level Security (RLS)

スキーマには基本的なRLSポリシーが含まれています:

- すべてのテーブルで読み取り・作成が可能
- 今後、認証機能を追加する場合は、ポリシーを更新してください

## 使用方法

### CRUD操作

`/lib/database.ts`に以下の関数が用意されています:

#### Rooms
- `getRooms()` - すべてのルームを取得
- `getRoom(id)` - 特定のルームを取得
- `getRoomWithStats(id)` - 統計情報付きでルームを取得
- `createRoom(room)` - ルームを作成
- `updateRoom(id, updates)` - ルームを更新
- `deleteRoom(id)` - ルームを削除

#### Entries
- `getEntries(roomId)` - ルーム内のすべてのエントリを取得
- `createEntry(entry)` - エントリを作成
- `deleteEntry(id)` - エントリを削除

#### Polls
- `getPolls(roomId)` - ルーム内のすべての投票選択肢を取得
- `getPollsWithVotes(roomId)` - 投票数付きで選択肢を取得
- `createPoll(poll)` - 選択肢を作成
- `createPolls(polls)` - 複数の選択肢を一括作成
- `deletePoll(id)` - 選択肢を削除

#### Votes
- `getVotes(pollId)` - 選択肢に対するすべての投票を取得
- `getRoomVotes(roomId)` - ルーム内のすべての投票を取得
- `createVote(vote)` - 投票を作成
- `hasUserVoted(pollId, userIdHash)` - ユーザーが投票済みか確認
- `getUserVotesInRoom(roomId, userIdHash)` - ルーム内のユーザーの投票を取得
- `deleteVote(id)` - 投票を削除

### 型定義

`/lib/types/database.ts`に型定義が含まれています:

```typescript
import { Room, Entry, Poll, Vote } from '@/lib/types/database';
import { createRoom, getEntries } from '@/lib/database';

// 使用例
const newRoom = await createRoom({
  title: '新しい議題',
  status: 'collecting'
});

const entries = await getEntries(newRoom.id);
```

## インデックス

パフォーマンス向上のため、以下のインデックスが作成されています:

- `entries.room_id`
- `polls.room_id`
- `votes.poll_id`
- `votes.user_id_hash`
- `rooms.status`
- `rooms.created_at`

## カスケード削除

- ルームを削除すると、関連するentries, polls, votesも自動削除されます
- 投票選択肢(poll)を削除すると、関連するvotesも自動削除されます
