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
  const [createdRoom, setCreatedRoom] = useState<{ url: string; adminCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const room = await createRoomAction(title);

      // Save admin code in localStorage
      localStorage.setItem(`room_admin_${room.id}`, room.admin_code);

      const url = `${window.location.origin}/${room.id}`;
      setCreatedRoom({ url, adminCode: room.admin_code });
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdRoom) return;

    try {
      await navigator.clipboard.writeText(createdRoom.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNewRoom = () => {
    setCreatedRoom(null);
    setCopied(false);
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
                  以下のURLをLINEなどで共有してください
                </p>
              </div>
            </div>

            {/* Room URL */}
            <div>
              <label className="text-xs font-semibold text-green-900 mb-1 block">
                共有用URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={createdRoom.url}
                  readOnly
                  className="flex-1 bg-white text-sm"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Admin Code */}
            <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg">
              <label className="text-xs font-semibold text-orange-900 mb-1 block">
                🔑 管理者コード（保管してください）
              </label>
              <div className="text-3xl font-bold text-center text-orange-900 py-2 tracking-widest">
                {createdRoom.adminCode}
              </div>
              <p className="text-xs text-orange-700 mt-2">
                リロードしても管理できるよう、このコードを控えておいてください
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => window.open(createdRoom.url, "_blank")}
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                ルームを開く
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
          placeholder="例: 文化祭の出し物について"
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
