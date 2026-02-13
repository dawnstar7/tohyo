"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitEntryAction } from "@/app/actions/room";
import { Loader2 } from "lucide-react";

interface EntryFormProps {
  roomId: string;
}

export function EntryForm({ roomId }: EntryFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await submitEntryAction(roomId, content);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="entry" className="text-sm font-medium">
          あなたの意見を投稿してください
        </label>
        <Input
          id="entry"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="意見を入力..."
          disabled={isSubmitting}
          className="w-full"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isSubmitting || !content.trim()}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        投稿する
      </Button>
    </form>
  );
}
