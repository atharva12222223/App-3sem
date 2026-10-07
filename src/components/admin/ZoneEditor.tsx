"use client";

// Zone demarcation editor: click the map to drop polygon vertices,
// choose VENDING (green) or NO_VENDING (red), name it, and save.
import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "@/lib/api-client";

type Zone = { id: string; name: string; type: string; region: string; polygon: string };

const vertexIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#1e3a5f;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function ZoneEditor({ zones, onSaved }: { zones: Zone[]; onSaved: () => void }) {
  const [draft, setDraft] = useState<[number, number][]>([]);
  const [type, setType] = useState<"VENDING" | "NO_VENDING">("VENDING");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const parsedZones = useMemo(
    () =>
      zones.map((z) => ({ ...z, coords: JSON.parse(z.polygon) as [number, number][] })),
    [zones]
  );

  async function save() {
    setError("");
    if (draft.length < 3) return setError("Mark at least 3 points on the map to form a zone.");
    if (!name || !region) return setError("Zone name and region are required.");
    setBusy(true);
    try {
      await api("/api/admin/zones", {
        method: "POST",
        auth: true,
        body: { name, type, region, polygon: draft },
      });
      setDraft([]);
      setName("");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, zoneName: string) {
    if (!window.confirm(`Delete zone "${zoneName}"? Vendors linked to it will be unassigned.`)) return;
    try {
      await api(`/api/admin/zones/${id}`, { method: "DELETE", auth: true });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="h-[55vh] overflow-hidden rounded-2xl shadow lg:h-[70vh]">
        <MapContainer center={[12.9822, 77.6055]} zoom={15} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickCatcher onPick={(lat, lng) => setDraft((d) => [...d, [lat, lng]])} />
          {parsedZones.map((z) => (
            <Polygon
              key={z.id}
              positions={z.coords}
              pathOptions={{
                color: z.type === "VENDING" ? "#16a34a" : "#dc2626",
                fillColor: z.type === "VENDING" ? "#22c55e" : "#ef4444",
                fillOpacity: 0.25,
                weight: 2,
                dashArray: z.type === "NO_VENDING" ? "6 6" : undefined,
              }}
            />
          ))}
          {draft.length > 2 && (
            <Polygon
              positions={draft}
              pathOptions={{
                color: type === "VENDING" ? "#16a34a" : "#dc2626",
                fillColor: type === "VENDING" ? "#22c55e" : "#ef4444",
                fillOpacity: 0.35,
                dashArray: "4 4",
              }}
            />
          )}
          {draft.map(([lat, lng], i) => (
            <Marker key={i} position={[lat, lng]} icon={vertexIcon} />
          ))}
        </MapContainer>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow">
          <h3 className="mb-3 font-extrabold text-civic-900">🖊️ Draw New Zone</h3>
          <p className="mb-3 text-sm text-slate-500">
            Tap the map to drop corner points (min 3). The shape closes automatically.
          </p>

          <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Zone type">
            <button
              type="button"
              role="radio"
              aria-checked={type === "VENDING"}
              onClick={() => setType("VENDING")}
              className={`rounded-xl border-2 px-3 py-3 text-sm font-extrabold ${
                type === "VENDING"
                  ? "border-verified-500 bg-green-50 text-verified-600"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              🟢 Vending Zone
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={type === "NO_VENDING"}
              onClick={() => setType("NO_VENDING")}
              className={`rounded-xl border-2 px-3 py-3 text-sm font-extrabold ${
                type === "NO_VENDING"
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              🔴 No-Vending Zone
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Zone name (e.g. MG Road Footpath)"
            aria-label="Zone name"
            className="mb-2 w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 font-semibold focus:border-civic-600 focus:outline-none"
          />
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Region / Ward (e.g. Ward 42)"
            aria-label="Region"
            className="mb-3 w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 font-semibold focus:border-civic-600 focus:outline-none"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="flex-1 rounded-xl bg-civic-600 py-3 font-extrabold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : `💾 Save (${draft.length} pts)`}
            </button>
            <button
              type="button"
              onClick={() => setDraft((d) => d.slice(0, -1))}
              disabled={draft.length === 0}
              className="rounded-xl bg-slate-200 px-4 py-3 font-extrabold text-slate-700 disabled:opacity-50"
            >
              ↩ Undo
            </button>
            <button
              type="button"
              onClick={() => setDraft([])}
              disabled={draft.length === 0}
              className="rounded-xl bg-slate-200 px-4 py-3 font-extrabold text-slate-700 disabled:opacity-50"
            >
              🗑
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 rounded-lg bg-red-100 p-2.5 text-sm font-semibold text-red-800">
              ⚠️ {error}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <h3 className="mb-2 font-extrabold text-civic-900">📁 Existing Zones ({zones.length})</h3>
          <ul className="space-y-2">
            {parsedZones.map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-800">
                    {z.type === "VENDING" ? "🟢" : "🔴"} {z.name}
                  </p>
                  <p className="text-xs text-slate-500">{z.region}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(z.id, z.name)}
                  className="shrink-0 rounded-lg bg-red-100 px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </li>
            ))}
            {zones.length === 0 && <li className="text-sm text-slate-500">No zones demarcated yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
