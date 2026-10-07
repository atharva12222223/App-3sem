"use client";

// Leaflet map (OpenStreetMap tiles — no API key needed). Rendered
// client-only via dynamic import in the parent page.
import { MapContainer, TileLayer, Marker, Polygon, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { categoryInfo } from "@/lib/categories";

export type MapVendor = {
  phone: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  rating: number;
  distanceKm: number | null;
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
    html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4));background:#fff;border:3px solid #16a34a;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">${icon}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#1d4ed8;border:4px solid #fff;box-shadow:0 0 0 3px rgba(29,78,216,.4);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Recenter({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, 16);
  }, [pos, map]);
  return null;
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
  const center: [number, number] = userPos ?? focusVendor ?? [12.9716, 77.5946]; // Bengaluru fallback

  return (
    <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter pos={focusVendor ?? userPos} />
      {userPos && <Marker position={userPos} icon={userIcon} />}
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
            <div className="min-w-[140px]">
              <strong>{v.name}</strong>
              <br />
              ⭐ {v.rating.toFixed(1)}
              {v.distanceKm != null && (
                <span>
                  {" "}
                  · {v.distanceKm < 1 ? `${Math.round(v.distanceKm * 1000)} m` : `${v.distanceKm.toFixed(1)} km`}
                </span>
              )}
              <br />
              <button
                type="button"
                onClick={() => onVendorSelect?.(v.phone)}
                className="mt-1 rounded-lg bg-civic-600 px-3 py-1.5 text-sm font-bold text-white"
              >
                View →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
