"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/api-client";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const session = getSession();
    setRole(session?.role ?? null);
  }, [pathname]);

  // Don't render until mounted (avoids SSR hydration mismatch)
  if (!mounted) return null;

  // --- Pages where nav is hidden ---
  // Vendor OTP login page
  if (pathname === "/vendor") return null;
  // Customer OTP login page
  if (pathname === "/customer/login") return null;
  // Admin page when NOT authenticated as admin (shows OTP form)
  if (pathname.startsWith("/admin") && role !== "ADMIN") return null;
  // Vendor dashboard login check redirect page (not needed since it redirects, but safe)
  if (pathname === "/vendor" && role !== "VENDOR") return null;

  const isAdmin = role === "ADMIN";
  const isVendor = role === "VENDOR";

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
      active:
        pathname === "/customer" ||
        (pathname.startsWith("/customer/vendor") &&
          !pathname.includes("favorites")),
    },
    {
      href: "/customer/favorites",
      label: "Saved",
      icon: "❤️",
      active: pathname === "/customer/favorites",
    },
    isAdmin
      ? {
          href: "/admin",
          label: "Admin",
          icon: "🏛️",
          active: pathname.startsWith("/admin"),
        }
      : {
          href: isVendor ? "/vendor/dashboard" : "/vendor",
          label: isVendor ? "My Shop" : "Vendor",
          icon: "🛒",
          active: pathname.startsWith("/vendor"),
        },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg border-t border-slate-200/80 bg-white/95 backdrop-blur-lg shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-14 items-center justify-around px-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all active:scale-90 ${
              item.active
                ? "text-civic-700 font-extrabold"
                : "text-slate-400 hover:text-slate-600 font-semibold"
            }`}
          >
            <span className="text-xl leading-none" aria-hidden>
              {item.icon}
            </span>
            <span className="text-[10px] leading-tight tracking-tight">
              {item.label}
            </span>
            {item.active && (
              <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-civic-600" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
