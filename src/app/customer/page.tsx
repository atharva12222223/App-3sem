"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { CategoryId } from "@/lib/categories";
import { SearchFilterBar } from "@/components/customer/SearchFilterBar";
import { VendorCard, VendorCardData } from "@/components/customer/VendorCard";
import type { MapVendor, MapZone } from "@/components/customer/MapView";

// Leaflet must not run during SSR
const MapView = dynamic(
  () => import("@/components/customer/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-slate-200" /> }
);

type View = "map" | "list";

export default function CustomerHomePage() {
  const [vendors, setVendors] = useState<VendorCardData[]>([]);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "ALL">("ALL");
  const [dutyOnly, setDutyOnly] = useState(true);
  const [view, setView] = useState<View>("map");
  const [loading, setLoading] = useState(true);
  const [locState, setLocState] = useState<"idle" | "granted" | "denied">("idle");

  // Geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) return setLocState("denied");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocState("granted");
      },
      () => setLocState("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ dutyOnly: String(dutyOnly) });
      if (userPos) {
        sp.set("lat", String(userPos[0]));
        sp.set("lng", String(userPos[1]));
        sp.set("radiusKm", "5");
      }
      if (category !== "ALL") sp.set("category", category);
      if (query) sp.set("q", query);
      const res = await api<{ vendors: VendorCardData[] }>(`/api/vendors?${sp}`);
      setVendors(res.vendors);
    } finally {
      setLoading(false);
    }
  }, [userPos, category, query, dutyOnly]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    api<{ zones: { id: string; name: string; type: MapZone["type"]; polygon: string }[] }>(
      "/api/admin/zones"
    )
      .then((res) =>
        setZones(
          res.zones.map((z) => ({ ...z, polygon: JSON.parse(z.polygon) }))
        )
      )
      .catch(() => {});
  }, []);

  const mapVendors: MapVendor[] = vendors
    .filter((v): v is VendorCardData & { lat: number; lng: number } => v.lat != null && v.lng != null)
    .map((v) => ({
      phone: v.phone,
      name: v.name,
      category: v.category,
      lat: v.lat,
      lng: v.lng,
      rating: v.rating,
      distanceKm: v.distanceKm,
    }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 space-y-3 bg-white/90 px-4 pb-3 pt-safe shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-slate-500 underline">← Home</Link>
          <h1 className="text-lg font-extrabold text-civic-900">📍 Vendors Near You</h1>
          <div className="flex overflow-hidden rounded-xl border-2 border-civic-600 text-sm font-extrabold">
            <button
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={`px-3 py-2 ${view === "map" ? "bg-civic-600 text-white" : "bg-white text-civic-600"}`}
            >
              🗺️ Map
            </button>
            <button
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`px-3 py-2 ${view === "list" ? "bg-civic-600 text-white" : "bg-white text-civic-600"}`}
            >
              ☰ List
            </button>
          </div>
        </div>
        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          dutyOnly={dutyOnly}
          onDutyOnlyChange={setDutyOnly}
        />
        {locState === "denied" && (
          <p className="rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800">
            📵 Location off — showing all verified vendors. Enable location for distances.
          </p>
        )}
      </header>

      {view === "map" ? (
        <div className="relative h-[55vh] w-full">
          <MapView
            vendors={mapVendors}
            zones={zones}
            userPos={userPos}
            onVendorSelect={(phone) => (window.location.href = `/customer/vendor/${phone}`)}
          />
        </div>
      ) : null}

      <section className="flex-1 space-y-3 px-4 py-4 pb-safe">
        {loading ? (
          <p className="py-8 text-center animate-pulse font-bold text-slate-500">
            Finding vendors… / विक्रेता खोजे जा रहे हैं…
          </p>
        ) : vendors.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            <p className="text-4xl" aria-hidden>🔍</p>
            <p className="mt-2 font-bold text-slate-700">No vendors found</p>
            <p className="text-sm text-slate-500">
              Try turning off “Open now” or clearing filters.
            </p>
          </div>
        ) : (
          vendors.map((v) => <VendorCard key={v.phone} vendor={v} />)
        )}
      </section>
    </main>
  );
}
