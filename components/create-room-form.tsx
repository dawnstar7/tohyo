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
  const [createdRoomUrl, setCreatedRoomUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const room = await createRoomAction(title);
      const url = `${window.location.origin}/${room.id}`;
      setCreatedRoomUrl(url);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdRoomUrl) return;

    try {
      await navigator.clipboard.writeText(createdRoomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNewRoom = () => {
    setCreatedRoomUrl(null);
    setCopied(false);
  };

  if (createdRoomUrl) {
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

            <div className="flex gap-2">
              <Input
                value={createdRoomUrl}
                readOnly
                className="flex-1 bg-white"
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

            <div className="flex gap-2">
              <Button
                onClick={() => window.open(createdRoomUrl, "_blank")}
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
