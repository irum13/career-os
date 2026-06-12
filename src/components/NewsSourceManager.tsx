"use client";

import { useRouter } from "next/navigation";
import { removeNewsSource } from "@/app/actions";

export function NewsSourceManager({
  entries,
}: {
  entries: { id: string; pattern: string; match_type: string; label: string | null }[];
}) {
  const router = useRouter();

  if (!entries.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No news sources yet. Add senders from your inbox or the form below.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          <div>
            <span className="font-medium text-slate-800">{entry.label || entry.pattern}</span>
            <span className="ml-2 text-xs text-[var(--muted)]">
              {entry.match_type} · {entry.pattern}
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await removeNewsSource(entry.id);
              router.refresh();
            }}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
