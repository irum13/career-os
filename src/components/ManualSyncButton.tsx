"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ManualSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSync() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/sync/mail", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Sync failed");
      } else {
        const parts = [`Synced ${data.synced ?? 0} items`];
        if (data.syncedNewsCount) parts.push(`${data.syncedNewsCount} from news sources`);
        if (data.briefGenerated) parts.push("brief generated");
        setMessage(parts.join(" · "));
        router.refresh();
      }
    } catch {
      setMessage("Sync failed");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Syncing..." : "Sync mail now"}
      </button>
      {message && <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>}
    </div>
  );
}
