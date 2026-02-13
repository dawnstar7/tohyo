"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoomAction } from "@/app/actions/room";
import { Loader2, Plus, Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CreateRoomForm() {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<{ participantUrl: string; adminUrl: string } | null>(null);
  const [copiedParticipant, setCopiedParticipant] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const room = await createRoomAction(title);
      const participantUrl = `${window.location.origin}/${room.id}`;
      const adminUrl = `${window.location.origin}/${room.id}/admin?token=${room.admin_token}`;
      setCreatedRoom({ participantUrl, adminUrl });
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyParticipant = async () => {
    if (!createdRoom) return;

    try {
      await navigator.clipboard.writeText(createdRoom.participantUrl);
      setCopiedParticipant(true);
      setTimeout(() => setCopiedParticipant(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyAdmin = async () => {
    if (!createdRoom) return;

    try {
      await navigator.clipboard.writeText(createdRoom.adminUrl);
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNewRoom = () => {
    setCreatedRoom(null);
    setCopiedParticipant(false);
    setCopiedAdmin(false);
  };

  if (createdRoom) {
    return (
      <div className="space-y-4">
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">ルームを作成しました！</h3>
                <p className="text-sm text-green-700 mt-1">
                  2つのURLが発行されました
                </p>
              </div>
            </div>

            {/* Admin URL */}
            <div className="space-y-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-orange-900">🔑 管理者用URL（あなた専用）</span>
              </div>
              <p className="text-xs text-orange-700">
                投票の進行管理ができます。このURLは誰にも共有しないでください
              </p>
              <div className="flex gap-2">
                <Input
                  value={createdRoom.adminUrl}
                  readOnly
                  className="flex-1 bg-white text-sm"
                />
                <Button
                  onClick={handleCopyAdmin}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copiedAdmin ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Participant URL */}
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-900">👥 参加者用URL（共有用）</span>
              </div>
              <p className="text-xs text-blue-700">
                このURLをLINEなどで共有して、みんなに意見を投稿してもらいましょう
              </p>
              <div className="flex gap-2">
                <Input
                  value={createdRoom.participantUrl}
                  readOnly
                  className="flex-1 bg-white text-sm"
                />
                <Button
                  onClick={handleCopyParticipant}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copiedParticipant ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => window.open(createdRoom.adminUrl, "_blank")}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                管理画面を開く
              </Button>
              <Button
                onClick={handleNewRoom}
                variant="outline"
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                新しいルームを作成
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          議題のタイトル
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 社内イベントの開催場所について"
          disabled={isCreating}
          className="w-full"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isCreating || !title.trim()} className="w-full">
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            作成中...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            新しいルームを作成
          </>
        )}
      </Button>
    </form>
  );
}
