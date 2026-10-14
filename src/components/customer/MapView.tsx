"use client";

// Leaflet map (OpenStreetMap tiles — no API key needed). Rendered
// client-only via dynamic import in the parent page.
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { categoryInfo } from "@/lib/categories";

export type MapVendor = {
  phone: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  rating: number;
  distanceKm: number | null;
  upiId?: string | null;
};

export type MapZone = {
  id: string;
  name: string;
  type: "VENDING" | "NO_VENDING";
  polygon: [number, number][];
};

const vendorIcon = (icon: string) =>
  L.divIcon({
    className: "",
    html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 3px 6px rgba(0,0,0,.25));background:#ffffff;border:3px solid #16a34a;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.92)'" onmouseup="this.style.transform='scale(1)'">${icon}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

const userIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:34px;height:34px;border-radius:50%;background:rgba(37,99,235,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.4);position:relative;z-index:2;"></div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function MapController({
  userPos,
  focusVendor,
  vendors,
}: {
  userPos: [number, number] | null;
  focusVendor?: [number, number] | null;
  vendors: MapVendor[];
}) {
  const map = useMap();
  const initialLockDone = useRef(false);

  // Invalidate size on load and layout changes to prevent grey tiles on mobile
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  // Centering on focus vendor
  useEffect(() => {
    if (focusVendor) {
      map.setView(focusVendor, 17, { animate: true });
    }
  }, [focusVendor, map]);

  // Initial user position lock (only once so user can freely pan)
  useEffect(() => {
    if (!initialLockDone.current && userPos && !focusVendor) {
      initialLockDone.current = true;
      map.flyTo(userPos, 16, { duration: 1.0 });
    }
  }, [userPos, focusVendor, map]);

  return (
    <div className="leaflet-bottom leaflet-right mb-4 mr-3 pointer-events-auto flex flex-col gap-2" style={{ zIndex: 999 }}>
      {userPos && (
        <button
          type="button"
          title="Recenter to my live GPS"
          onClick={() => map.flyTo(userPos, 16, { duration: 1.0 })}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xl border border-slate-200 text-lg hover:bg-slate-50 active:scale-90 transition-transform"
          aria-label="My Live GPS"
        >
          🎯
        </button>
      )}

      {vendors.length > 0 && (
        <button
          type="button"
          title="Fit all vendors on map"
          onClick={() => {
            const bounds = L.latLngBounds(vendors.map((v) => [v.lat, v.lng] as [number, number]));
            if (userPos) bounds.extend(userPos);
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
          }}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xl border border-slate-200 text-lg hover:bg-slate-50 active:scale-90 transition-transform"
          aria-label="Fit vendors on map"
        >
          🔍
        </button>
      )}
    </div>
  );
}

export function MapView({
  vendors,
  zones,
  userPos,
  onVendorSelect,
  focusVendor,
}: {
  vendors: MapVendor[];
  zones: MapZone[];
  userPos: [number, number] | null;
  onVendorSelect?: (phone: string) => void;
  focusVendor?: [number, number] | null;
}) {
  const center: [number, number] = userPos ?? focusVendor ?? (vendors.length > 0 ? [vendors[0].lat, vendors[0].lng] : [12.9716, 77.5946]); // Bengaluru default

  return (
    <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController userPos={userPos} focusVendor={focusVendor} vendors={vendors} />

      {userPos && (
        <Marker position={userPos} icon={userIcon}>
          <Popup>
            <div className="text-center py-1">
              <strong className="text-blue-600 font-bold">📍 Your Live Location</strong>
              <p className="text-xs text-slate-500">आप यहाँ हैं</p>
            </div>
          </Popup>
        </Marker>
      )}

      {zones.map((z) => (
        <Polygon
          key={z.id}
          positions={z.polygon}
          pathOptions={{
            color: z.type === "VENDING" ? "#16a34a" : "#dc2626",
            fillColor: z.type === "VENDING" ? "#22c55e" : "#ef4444",
            fillOpacity: 0.15,
            weight: 2,
            dashArray: z.type === "NO_VENDING" ? "6 6" : undefined,
          }}
        />
      ))}

      {vendors.map((v) => (
        <Marker key={v.phone} position={[v.lat, v.lng]} icon={vendorIcon(categoryInfo(v.category).icon)}>
          <Popup>
            <div className="min-w-[170px] space-y-1.5 p-1 text-slate-900">
              <div className="flex items-start justify-between gap-1">
                <strong className="text-sm font-extrabold leading-tight">{v.name}</strong>
              </div>
              <p className="text-xs font-semibold text-slate-600">
                {categoryInfo(v.category).icon} {categoryInfo(v.category).en} · ⭐ {v.rating > 0 ? v.rating.toFixed(1) : "New"}
                {v.distanceKm != null && (
                  <span className="text-slate-500">
                    {" "}· {v.distanceKm < 1 ? `${Math.round(v.distanceKm * 1000)}m` : `${v.distanceKm.toFixed(1)}km`}
                  </span>
                )}
              </p>
              <div className="mt-2 flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onVendorSelect?.(v.phone)}
                  className="flex-1 rounded-xl bg-civic-600 py-1.5 px-2 text-center text-xs font-extrabold text-white hover:bg-civic-700 active:scale-95 transition"
                >
                  View Details →
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in Google Maps"
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-xs font-extrabold text-slate-700 hover:bg-slate-200"
                >
                  🧭
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
