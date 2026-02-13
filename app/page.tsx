import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateRoomForm } from "@/components/create-room-form";
import type { Room } from "@/lib/types/database";

async function getRooms() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rooms")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (data || []) as Room[];
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

export default async function Home() {
  const rooms = await getRooms();

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            TOHYO - AI Consensus Poll
          </h1>
          <p className="text-lg text-muted-foreground">
            AIが意見をまとめて、みんなで投票する意思決定プラットフォーム
          </p>
        </div>

        {/* Create Room Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>新しい投票ルームを作成</CardTitle>
            <CardDescription>
              議題を設定して、意見を集めましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRoomForm />
          </CardContent>
        </Card>

        {/* Recent Rooms */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">最近のルーム</h2>

          {rooms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                まだルームがありません。最初のルームを作成してみましょう！
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rooms.map((room) => (
                <Link key={room.id} href={`/${room.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{room.title}</CardTitle>
                          <CardDescription className="mt-1">
                            作成: {new Date(room.created_at).toLocaleDateString("ja-JP")}
                          </CardDescription>
                        </div>
                        <Badge className={statusColors[room.status]}>
                          {statusLabels[room.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* How it Works */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>TOHYOの使い方</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-500 min-w-8 justify-center">1</Badge>
                <div>
                  <h3 className="font-semibold">意見を集める</h3>
                  <p className="text-sm text-muted-foreground">
                    ルームを作成し、参加者から自由に意見を投稿してもらいます
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge className="bg-green-500 min-w-8 justify-center">2</Badge>
                <div>
                  <h3 className="font-semibold">AIが選択肢を生成</h3>
                  <p className="text-sm text-muted-foreground">
                    集まった意見をAIが分析し、5つの具体的な選択肢を自動生成します
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge className="bg-purple-500 min-w-8 justify-center">3</Badge>
                <div>
                  <h3 className="font-semibold">投票する</h3>
                  <p className="text-sm text-muted-foreground">
                    生成された選択肢に投票し、集団の意思を可視化します
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
