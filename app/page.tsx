import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateRoomForm } from "@/components/create-room-form";

export default function Home() {
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
              議題を設定して、URLを共有しましょう
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRoomForm />
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>TOHYOの使い方</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-500 min-w-8 justify-center">1</Badge>
                <div>
                  <h3 className="font-semibold">ルームを作成してURLを共有</h3>
                  <p className="text-sm text-muted-foreground">
                    議題を入力してルームを作成し、発行されたURLをLINEなどで共有します
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge className="bg-green-500 min-w-8 justify-center">2</Badge>
                <div>
                  <h3 className="font-semibold">みんなで意見を投稿</h3>
                  <p className="text-sm text-muted-foreground">
                    URLにアクセスした参加者が自由に意見を投稿します
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge className="bg-purple-500 min-w-8 justify-center">3</Badge>
                <div>
                  <h3 className="font-semibold">AIが選択肢を生成</h3>
                  <p className="text-sm text-muted-foreground">
                    主催者が意見を締め切ると、AIが5つの具体的な選択肢を自動生成します
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge className="bg-orange-500 min-w-8 justify-center">4</Badge>
                <div>
                  <h3 className="font-semibold">投票して結果を確認</h3>
                  <p className="text-sm text-muted-foreground">
                    生成された選択肢に投票し、最も支持された案を決定します
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
