"use client";

import { useRouter } from "next/navigation";
import { setItemPriority, promoteItem, dismissAllFromSender, addNewsSource } from "@/app/actions";
import type { ItemPriority } from "@/lib/types";

export function InboxActions({
  itemId,
  sender,
}: {
  itemId: string;
  sender: string | null;
}) {
  const router = useRouter();
  const priorities: { key: ItemPriority; label: string }[] = [
    { key: "high", label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low", label: "Low" },
    { key: "dismissed", label: "Hide" },
  ];

  async function run(fn: () => Promise<void>) {
    await fn();
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {priorities.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => run(() => setItemPriority(itemId, key))}
            className="rounded border border-[var(--border)] px-2 py-0.5 text-xs hover:bg-slate-50"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => run(() => promoteItem(itemId, "job"))}
          className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100"
        >
          → Job
        </button>
        <button
          type="button"
          onClick={() => run(() => promoteItem(itemId, "scholarship"))}
          className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700 hover:bg-purple-100"
        >
          → Scholarship
        </button>
      </div>
      {sender && (
        <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-2">
          <button
            type="button"
            onClick={() => run(() => addNewsSource(sender))}
            className="text-left text-xs text-emerald-700 hover:underline"
          >
            Add to News
          </button>
          <button
            type="button"
            onClick={() => run(() => dismissAllFromSender(sender, false))}
            className="text-left text-xs text-red-600 hover:underline"
          >
            Hide all from sender
          </button>
          <button
            type="button"
            onClick={() => run(() => dismissAllFromSender(sender, true))}
            className="text-left text-xs text-red-600 hover:underline"
          >
            Hide all + block future
          </button>
        </div>
      )}
    </div>
  );
}
