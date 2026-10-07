"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getSession } from "@/lib/api-client";
import { AdminNav } from "@/components/admin/AdminNav";
import { BroadcastPanel, BroadcastRecord } from "@/components/admin/BroadcastPanel";

type Zone = { id: string; name: string };

export default function AdminBroadcastPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [history, setHistory] = useState<BroadcastRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getSession()?.role !== "ADMIN") router.replace("/admin");
  }, [router]);

  const load = useCallback(async () => {
    try {
      const [zRes, bRes] = await Promise.all([
        api<{ zones: Zone[] }>("/api/admin/zones"),
        api<{ broadcasts: BroadcastRecord[] }>("/api/admin/broadcast", { auth: true }),
      ]);
      setZones(zRes.zones);
      setHistory(bRes.broadcasts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-4 px-4 py-6 pb-safe pt-safe">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
          >
            ← Back to Approvals
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
          >
            🏠 Home
          </Link>
        </div>
        <h1 className="text-2xl font-extrabold text-civic-900">
          📢 Vendor Broadcast <span className="text-base font-semibold text-slate-500">/ सूचना प्रसारण</span>
        </h1>
        <p className="text-sm font-semibold text-slate-500">
          Send push notifications & SMS to registered vendors — traffic diversions, health
          guidelines, weather alerts, meeting notices.
        </p>
      </header>

      <AdminNav />

      {loading ? (
        <p className="py-10 text-center animate-pulse font-bold text-slate-500">Loading…</p>
      ) : (
        <BroadcastPanel zones={zones} history={history} onSent={load} />
      )}
    </main>
  );
}
