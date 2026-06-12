"use client";

import { useRouter } from "next/navigation";
import { removeSenderBlocklist } from "@/app/actions";

export function BlocklistManager({
  entries,
}: {
  entries: { id: string; pattern: string; match_type: string; label: string | null }[];
}) {
  const router = useRouter();

  if (!entries.length) {
    return <p className="text-sm text-[var(--muted)]">No blocked senders yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          <div>
            <span className="font-medium text-slate-800">{e.label || e.pattern}</span>
            <span className="ml-2 text-xs text-[var(--muted)]">
              {e.match_type} · {e.pattern}
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await removeSenderBlocklist(e.id);
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
