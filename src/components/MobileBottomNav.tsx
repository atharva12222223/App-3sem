"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/api-client";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session) setRole(session.role);
  }, [pathname]);

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: "🏠",
      active: pathname === "/",
    },
    {
      href: "/customer",
      label: "Explore",
      icon: "📍",
      active: pathname === "/customer" || (pathname.startsWith("/customer/vendor") && !pathname.includes("favorites")),
    },
    {
      href: "/customer/favorites",
      label: "Saved",
      icon: "❤️",
      active: pathname === "/customer/favorites",
    },
    {
      href: role === "VENDOR" ? "/vendor/dashboard" : "/vendor",
      label: "Vendor",
      icon: "🛒",
      active: pathname.startsWith("/vendor"),
    },
    {
      href: "/admin",
      label: "Admin",
      icon: "🏛️",
      active: pathname.startsWith("/admin"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg border-t border-slate-200/80 bg-white/95 backdrop-blur-lg shadow-lg safe-area-bottom"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`relative flex flex-1 flex-col items-center justify-center py-1 transition-all active:scale-90 ${
              item.active
                ? "text-civic-900 font-extrabold"
                : "text-slate-400 hover:text-slate-600 font-semibold"
            }`}
          >
            <span className="text-xl leading-none mb-1" aria-hidden>
              {item.icon}
            </span>
            <span className="text-[11px] leading-tight tracking-tight">
              {item.label}
            </span>
            {item.active && (
              <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-civic-600" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
