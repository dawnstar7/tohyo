import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntryForm } from "@/components/entry-form";
import { EntryList } from "@/components/entry-list";
import { VotingPanel } from "@/components/voting-panel";
import { AdminControls } from "@/components/admin-controls";
import { generateUserIdHash } from "@/lib/utils/hash";
import type { Room, Entry, Poll, Vote } from "@/lib/types/database";

interface PollWithVotes extends Poll {
  vote_count: number;
}

async function getRoomData(roomId: string) {
  const supabase = await createClient();

  // Get room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError) return null;

  // Get entries
  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  // Get polls
  const { data: polls } = await supabase
    .from("polls")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  // Get vote counts for each poll
  let pollsWithVotes: PollWithVotes[] = [];
  if (polls && polls.length > 0) {
    pollsWithVotes = await Promise.all(
      polls.map(async (poll) => {
        const { count } = await supabase
          .from("votes")
          .select("id", { count: "exact" })
          .eq("poll_id", poll.id);

        return {
          ...poll,
          vote_count: count || 0,
        };
      })
    );
  }

  return {
    room: room as Room,
    entries: (entries || []) as Entry[],
    polls: pollsWithVotes,
  };
}

async function getUserVotedPollIds(roomId: string, userIdHash: string) {
  const supabase = await createClient();

  // Get all poll IDs for this room
  const { data: polls } = await supabase
    .from("polls")
    .select("id")
    .eq("room_id", roomId);

  if (!polls || polls.length === 0) return [];

  const pollIds = polls.map((p) => p.id);

  // Get votes by this user
  const { data: votes } = await supabase
    .from("votes")
    .select("poll_id")
    .in("poll_id", pollIds)
    .eq("user_id_hash", userIdHash);

  return votes?.map((v) => v.poll_id) || [];
}

const statusLabels = {
  collecting: "意見募集中",
  voting: "投票中",
  closed: "締切済み",
};

const statusColors = {
  collecting: "bg-blue-500",
  voting: "bg-green-500",
  closed: "bg-gray-500",
};

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const data = await getRoomData(roomId);

  if (!data) {
    notFound();
  }

  const { room, entries, polls } = data;

  // Generate user ID hash for checking voted status (server-side)
  const userIdHash = await generateUserIdHash();
  const userVotedPollIds = room.status === "voting" || room.status === "closed"
    ? await getUserVotedPollIds(roomId, userIdHash)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Room Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{room.title}</CardTitle>
                <CardDescription className="mt-2">
                  作成日: {new Date(room.created_at).toLocaleString("ja-JP")}
                </CardDescription>
              </div>
              <Badge className={statusColors[room.status]}>
                {statusLabels[room.status]}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Collecting Phase: Entry Form and List */}
        {room.status === "collecting" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>意見を投稿する</CardTitle>
                <CardDescription>
                  この議題についてあなたの意見を共有してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EntryForm roomId={roomId} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <EntryList entries={entries} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Voting Phase: Show Polls */}
        {room.status === "voting" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>投票</CardTitle>
                <CardDescription>
                  集まった意見をもとにAIが作成した選択肢から選んで投票してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VotingPanel polls={polls} userVotedPollIds={userVotedPollIds} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Closed Phase: Show Results */}
        {room.status === "closed" && (
          <div className="space-y-6">
            {/* Winner Announcement */}
            {polls.length > 0 && (() => {
              const sortedPolls = [...polls].sort((a, b) => b.vote_count - a.vote_count);
              const winner = sortedPolls[0];
              const totalVotes = polls.reduce((sum, p) => sum + p.vote_count, 0);

              return (
                <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">🏆</span>
                      <CardTitle className="text-2xl">最も支持された選択肢</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                      <h3 className="text-xl font-bold mb-2">{winner.option_text}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-3">{winner.explanation}</p>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                          {winner.vote_count}票 ({totalVotes > 0 ? Math.round((winner.vote_count / totalVotes) * 100) : 0}%)
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          総投票数: {totalVotes}票
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            <Card>
              <CardHeader>
                <CardTitle>全ての投票結果（順位順）</CardTitle>
                <CardDescription>
                  投票は締め切られました。最終結果をご覧ください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VotingPanel polls={polls} userVotedPollIds={userVotedPollIds} showRanking={true} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Controls */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <AdminControls
              roomId={roomId}
              status={room.status}
              entryCount={entries.length}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
