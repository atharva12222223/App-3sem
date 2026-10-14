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

const PRESET_LOCATIONS = [
  { name: "Bengaluru", coords: [12.9822, 77.6055] as [number, number] },
  { name: "Delhi", coords: [28.6139, 77.2090] as [number, number] },
  { name: "Mumbai", coords: [19.0760, 72.8777] as [number, number] },
  { name: "Pune", coords: [18.5204, 73.8567] as [number, number] },
  { name: "Hyderabad", coords: [17.3850, 78.4867] as [number, number] },
];

export default function CustomerHomePage() {
  const [vendors, setVendors] = useState<VendorCardData[]>([]);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("Bengaluru (Demo)");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "ALL">("ALL");
  const [dutyOnly, setDutyOnly] = useState(true);
  const [view, setView] = useState<View>("map");
  const [loading, setLoading] = useState(true);
  const [locState, setLocState] = useState<"idle" | "granted" | "denied">("idle");

  const requestLiveLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocState("denied");
      return;
    }
    setLocState("idle");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setSelectedCity("Live GPS");
        setLocState("granted");
      },
      () => {
        setLocState("denied");
        // Fallback to Bengaluru demo coords if none set
        if (!userPos) {
          setUserPos([12.9822, 77.6055]);
          setSelectedCity("Bengaluru (Default)");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [userPos]);

  // Geolocation on mount
  useEffect(() => {
    requestLiveLocation();
  }, [requestLiveLocation]);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ dutyOnly: String(dutyOnly) });
      if (userPos) {
        sp.set("lat", String(userPos[0]));
        sp.set("lng", String(userPos[1]));
        sp.set("radiusKm", "10");
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
      upiId: v.upiId,
    }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col pb-24">
      <header className="sticky top-0 z-10 space-y-3 bg-white/95 px-4 pb-3 pt-safe shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-600 hover:text-slate-900">
            ← Home
          </Link>
          <h1 className="text-base font-extrabold text-civic-900">📍 Street Vendors</h1>
          <div className="flex overflow-hidden rounded-xl border border-civic-600 text-xs font-extrabold shadow-sm">
            <button
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={`px-3 py-1.5 transition ${view === "map" ? "bg-civic-600 text-white" : "bg-white text-civic-600"}`}
            >
              🗺️ Map
            </button>
            <button
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`px-3 py-1.5 transition ${view === "list" ? "bg-civic-600 text-white" : "bg-white text-civic-600"}`}
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

        {/* Location status & City selector */}
        <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
          {locState === "granted" && userPos ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700 border border-blue-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                Live GPS active
              </span>
              <button
                type="button"
                onClick={requestLiveLocation}
                className="text-[11px] font-bold text-blue-600 underline hover:text-blue-800"
              >
                🔄 Refresh
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={requestLiveLocation}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
              >
                📍 Enable GPS
              </button>
            </div>
          )}

          {/* Quick city switcher */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>City:</span>
            <select
              value={selectedCity}
              onChange={(e) => {
                const sel = PRESET_LOCATIONS.find((p) => p.name === e.target.value);
                if (sel) {
                  setUserPos(sel.coords);
                  setSelectedCity(sel.name);
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-700 focus:outline-none"
            >
              <option value="Live GPS">Live GPS / Current</option>
              {PRESET_LOCATIONS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {view === "map" && (
        <div className="relative h-[48vh] w-full border-b border-slate-200">
          <MapView
            vendors={mapVendors}
            zones={zones}
            userPos={userPos}
            onVendorSelect={(phone) => (window.location.href = `/customer/vendor/${phone}`)}
          />
        </div>
      )}

      <section className="flex-1 space-y-3 px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800">
            {dutyOnly ? "🟢 Open Vendors" : "All Registered Vendors"} ({vendors.length})
          </h2>
          {category !== "ALL" && (
            <button
              onClick={() => setCategory("ALL")}
              className="text-xs font-bold text-civic-600 underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {loading ? (
          <p className="py-8 text-center animate-pulse text-sm font-bold text-slate-500">
            Finding vendors nearby… / विक्रेता खोजे जा रहे हैं…
          </p>
        ) : vendors.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <p className="text-4xl" aria-hidden>🔍</p>
            <p className="mt-2 font-bold text-slate-700">No vendors found matching filters</p>
            <p className="mt-1 text-xs text-slate-500">
              Try switching &quot;Open now&quot; off or choosing another category.
            </p>
            <button
              onClick={() => {
                setDutyOnly(false);
                setCategory("ALL");
                setQuery("");
              }}
              className="mt-4 rounded-xl bg-civic-600 px-4 py-2 text-xs font-extrabold text-white shadow"
            >
              Show all vendors
            </button>
          </div>
        ) : (
          vendors.map((v) => <VendorCard key={v.phone} vendor={v} />)
        )}
      </section>
    </main>
  );
}
