"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearSession, getSession } from "@/lib/api-client";
import { OtpLogin } from "@/components/OtpLogin";
import { AdminNav } from "@/components/admin/AdminNav";
import { PendingVendorsTable, PendingVendor } from "@/components/admin/PendingVendorsTable";

type AdminProfile = { id: string; name: string; department: string; region: string };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (getSession()?.role === "ADMIN") setAuthed(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, queue] = await Promise.all([
        api<{ admin: AdminProfile }>("/api/admin/me", { auth: true }).catch(() => ({ admin: null })),
        api<{ vendors: PendingVendor[] }>(`/api/admin/vendors?status=${statusFilter}`, { auth: true }),
      ]);
      if (me.admin) setAdmin(me.admin);
      setVendors(queue.vendors);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  if (!mounted) return null;

  if (!authed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
        <OtpLogin
          role="ADMIN"
          icon="🏛️"
          title="Municipal Admin Login"
          subtitle="नगरपालिका लॉगिन — authorized officers only"
          onLoggedIn={() => setAuthed(true)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-4 px-4 py-6 pb-safe pt-safe">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-civic-900">🏛️ Town Vending Committee</h1>
          {admin && (
            <p className="text-sm font-semibold text-slate-500">
              {admin.name} · {admin.department} · {admin.region}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            clearSession();
            router.replace("/admin");
            setAuthed(false);
          }}
          className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow"
        >
          Logout ↩
        </button>
      </header>

      <AdminNav />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-800">
            Vendor Registrations{" "}
            <span className="rounded-full bg-civic-600 px-3 py-1 text-sm text-white">
              {vendors.length}
            </span>
          </h2>
          <div className="flex gap-2 text-sm font-bold">
            {["PENDING", "APPROVED", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                aria-pressed={statusFilter === s}
                className={`rounded-full px-4 py-2 ${
                  statusFilter === s
                    ? "bg-civic-900 text-white"
                    : "bg-white text-slate-600 shadow"
                }`}
              >
                {s === "PENDING" ? "⏳ Pending" : s === "APPROVED" ? "✓ Approved" : "✗ Rejected"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center animate-pulse font-bold text-slate-500">Loading queue…</p>
        ) : (
          <PendingVendorsTable vendors={vendors} onDecided={load} />
        )}
      </section>
    </main>
  );
}
