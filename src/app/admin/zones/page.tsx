"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getSession } from "@/lib/api-client";
import { AdminNav } from "@/components/admin/AdminNav";

const ZoneEditor = dynamic(
  () => import("@/components/admin/ZoneEditor").then((m) => m.ZoneEditor),
  {
    ssr: false,
    loading: () => <div className="h-[55vh] w-full animate-pulse rounded-2xl bg-slate-200" />,
  }
);

type Zone = { id: string; name: string; type: string; region: string; polygon: string };

export default function AdminZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getSession()?.role !== "ADMIN") router.replace("/admin");
  }, [router]);

  const load = useCallback(async () => {
    try {
      const res = await api<{ zones: Zone[] }>("/api/admin/zones");
      setZones(res.zones);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-civic-900">🗺️ Vending Zone Demarcation</h1>
        <p className="text-sm font-semibold text-slate-500">
          Draw <span className="font-extrabold text-verified-600">green vending zones</span> and{" "}
          <span className="font-extrabold text-red-600">red no-vending zones</span> per the Street
          Vendors Act survey.
        </p>
      </header>

      <AdminNav />

      {loading ? (
        <p className="py-10 text-center animate-pulse font-bold text-slate-500">Loading zones…</p>
      ) : (
        <ZoneEditor zones={zones} onSaved={load} />
      )}
    </main>
  );
}
