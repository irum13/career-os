"use client";

import { useState } from "react";

export function ManualSyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSync() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/sync/mail", { method: "POST" });
      const data = await res.json();
      setMessage(res.ok ? `Synced ${data.synced ?? 0} items` : data.error || "Sync failed");
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
