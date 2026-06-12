"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import { InboxActions } from "@/components/InboxActions";
import { OpenMailLink } from "@/components/OpenMailLink";
import { bulkDismissItems, bulkSetPriority } from "@/app/actions";
import type { Item, ItemPriority, SourceType } from "@/lib/types";

type InboxItem = {
  id: string;
  title: string;
  summary: string | null;
  sender: string | null;
  source_type: SourceType;
  external_id: string | null;
  url: string | null;
  priority: string;
  category: string;
  folder: string | null;
  received_at: string;
};

export function InboxList({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }

  async function runBulk(action: () => Promise<void>) {
    await action();
    setSelected(new Set());
    router.refresh();
  }

  const selectedIds = [...selected];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-slate-50 px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded border-slate-300"
          />
          Select all ({items.length})
        </label>

        {someSelected && (
          <>
            <span className="text-sm text-[var(--muted)]">{selected.size} selected</span>
            <button
              type="button"
              onClick={() => runBulk(() => bulkDismissItems(selectedIds))}
              className="rounded-lg border border-red-200 bg-white px-3 py-1 text-sm text-red-700 hover:bg-red-50"
            >
              Hide selected
            </button>
            {(["high", "medium", "low"] as ItemPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => runBulk(() => bulkSetPriority(selectedIds, p))}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-1 text-sm capitalize hover:bg-slate-100"
              >
                Mark {p}
              </button>
            ))}
          </>
        )}
      </div>

      {items.map((item) => (
        <Card key={item.id} className="!p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              className="mt-1 rounded border-slate-300"
            />
            <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-900">{item.title}</h3>
                  <Badge label={item.priority} />
                  <Badge label={item.category} />
                  {item.folder && <Badge label={item.folder} />}
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.sender} · {item.source_type} · {formatDateTime(item.received_at)}
                </p>
                {item.summary && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
                )}
                <OpenMailLink
                  sourceType={item.source_type}
                  externalId={item.external_id}
                  url={item.url}
                />
              </div>
              <InboxActions itemId={item.id} sender={item.sender} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
