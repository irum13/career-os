import Link from "next/link";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "alerts", label: "Alerts" },
  { key: "review", label: "Review queue" },
  { key: "ai_news", label: "AI news" },
  { key: "newsletter", label: "Newsletters" },
] as const;

export function InboxFilters({ active }: { active: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {FILTERS.map(({ key, label }) => (
        <Link
          key={key}
          href={key === "all" ? "/inbox" : `/inbox?filter=${key}`}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            active === key
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
