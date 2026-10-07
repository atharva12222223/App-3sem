"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "🏠 Home" },
  { href: "/admin", label: "📋 Approvals" },
  { href: "/admin/zones", label: "🗺️ Zones" },
  { href: "/admin/broadcast", label: "📢 Broadcast" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 rounded-2xl bg-white p-1.5 shadow" aria-label="Admin sections">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 rounded-xl px-3 py-3 text-center text-sm font-extrabold transition ${
              active ? "bg-civic-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
