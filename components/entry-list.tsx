import { Card, CardContent } from "@/components/ui/card";
import type { Entry } from "@/lib/types/database";

interface EntryListProps {
  entries: Entry[];
}

export function EntryList({ entries }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        まだ意見が投稿されていません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">投稿された意見 ({entries.length}件)</h3>
      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <p className="text-sm">{entry.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(entry.created_at).toLocaleString("ja-JP")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
