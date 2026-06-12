"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  Briefcase,
  GraduationCap,
  BookOpen,
  CreditCard,
  Users,
  Zap,
  Bell,
  Settings,
  Rss,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/scholarships", label: "Scholarships", icon: GraduationCap },
  { href: "/work", label: "Coursework & TA", icon: BookOpen },
  { href: "/money", label: "Subscriptions", icon: CreditCard },
  { href: "/people", label: "People", icon: Users },
  { href: "/actions", label: "Actions", icon: Zap },
  { href: "/sources", label: "Sources", icon: Rss },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col bg-[var(--sidebar)] text-[var(--sidebar-text)]">
      <div className="border-b border-slate-700 px-5 py-5">
        <h1 className="text-lg font-semibold text-white">Career OS</h1>
        <p className="text-xs text-slate-400">UH · Data Science</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--sidebar-active)] text-white"
                  : "hover:bg-[var(--sidebar-active)] hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
