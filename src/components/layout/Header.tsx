import { Plus } from "lucide-react";
import { QuickCaptureButton } from "@/components/QuickCapture";

interface HeaderProps {
  title: string;
  subtitle?: string;
  alertCount?: number;
}

export function Header({ title, subtitle, alertCount }: HeaderProps) {
  return (
    <header className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {alertCount !== undefined && alertCount > 0 && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            {alertCount} unread
          </span>
        )}
        <QuickCaptureButton />
      </div>
    </header>
  );
}

export function QuickCaptureFab() {
  return (
    <QuickCaptureButton className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">
      <Plus size={16} />
      Quick Capture
    </QuickCaptureButton>
  );
}
