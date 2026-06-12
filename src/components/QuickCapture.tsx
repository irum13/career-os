"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { quickCapture } from "@/app/actions";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "job", label: "Job" },
  { value: "scholarship", label: "Scholarship" },
  { value: "deadline", label: "Deadline" },
  { value: "link", label: "Link / Save" },
  { value: "idea", label: "Post idea" },
];

export function QuickCaptureButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        }
      >
        {children ?? (
          <>
            <Plus size={16} />
            Quick Capture
          </>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick Capture</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form
              action={async (fd) => {
                await quickCapture(fd);
                setOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                <select
                  name="type"
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  defaultValue="link"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                <input
                  name="title"
                  required
                  placeholder="Company name, deadline title, or link description"
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">URL (optional)</label>
                <input
                  name="url"
                  type="url"
                  placeholder="https://..."
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes / Role (optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Due date (optional)</label>
                <input
                  name="due_date"
                  type="date"
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className={cn(
                  "w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                )}
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
