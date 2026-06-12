import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
  unclassified: "bg-blue-50 text-blue-700",
  dismissed: "bg-slate-100 text-slate-400",
  interested: "bg-blue-50 text-blue-700",
  applied: "bg-purple-50 text-purple-700",
  interview: "bg-amber-50 text-amber-700",
  offer: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  alerts: "bg-emerald-50 text-emerald-700",
  job_alert: "bg-emerald-50 text-emerald-700",
  updates: "bg-violet-50 text-violet-700",
  social: "bg-pink-50 text-pink-700",
};

export function Badge({ label, className }: { label: string; className?: string }) {
  const key = label.toLowerCase().replace(/\s/g, "_");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        variants[key] ?? "bg-slate-100 text-slate-600",
        className
      )}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}
