"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateNewsBriefAction } from "@/app/actions";

export function GenerateBriefButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setMessage("");
    try {
      await generateNewsBriefAction();
      setMessage("Brief generated.");
      router.refresh();
    } catch {
      setMessage("Could not generate brief.");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate brief"}
      </button>
      {message && <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>}
    </div>
  );
}
