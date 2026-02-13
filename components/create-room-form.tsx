"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoomAction } from "@/app/actions/room";
import { Loader2, Plus } from "lucide-react";

export function CreateRoomForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const room = await createRoomAction(title);
      router.push(`/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setIsCreating(false);
    }
  };

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
