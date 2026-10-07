"use client";

// Giant accessible ON/OFF duty toggle. Green = open & sharing live location,
// Red = closed. Designed to be operated at a glance under direct sunlight.
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

export function DutyStatusToggle({ initial }: { initial: boolean }) {
  const [active, setActive] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function ping(lat?: number, lng?: number) {
    try {
      const res = await api<{ vendor: { lastPingAt: string } }>(
        "/api/vendors/me/status",
        { method: "POST", auth: true, body: { dutyActive: true, lat, lng } }
      );
      if (lat && lng) setCoords({ lat, lng });
      setLastPing(new Date(res.vendor.lastPingAt));
    } catch {
      /* silent — next tick will retry */
    }
  }

  async function toggle() {
    const next = !active;
    setError("");
    setBusy(true);
    try {
      if (next) {
        let captured = false;
        if (typeof window !== "undefined" && navigator.geolocation) {
          try {
            await new Promise<void>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  try {
                    captured = true;
                    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    await api("/api/vendors/me/status", {
                      method: "POST",
                      auth: true,
                      body: { dutyActive: true, lat: pos.coords.latitude, lng: pos.coords.longitude },
                    });
                    setLastPing(new Date());
                    resolve();
                  } catch (e) {
                    reject(e);
                  }
                },
                () => resolve(),
                { enableHighAccuracy: true, timeout: 8000 }
              );
            });
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
            return;
          }
        }
        if (!captured) {
          await api("/api/vendors/me/status", {
            method: "POST",
            auth: true,
            body: { dutyActive: true },
          });
          setLastPing(new Date());
        }
        intervalRef.current = setInterval(() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => ping(pos.coords.latitude, pos.coords.longitude),
              () => ping()
            );
          } else ping();
        }, 2 * 60 * 1000);
      } else {
        await api("/api/vendors/me/status", {
          method: "POST",
          auth: true,
          body: { dutyActive: false },
        });
        if (intervalRef.current) clearInterval(intervalRef.current);
        setLastPing(null);
        setCoords(null);
      }
      setActive(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="mb-3 text-center text-lg font-extrabold text-civic-900">
        {active ? "🟢 You are OPEN" : "🔴 You are CLOSED"}
        <span className="block text-sm font-medium text-slate-500">
          {active ? "आप खुले हैं — ग्राहकों को दिख रहे हैं" : "आप बंद हैं — ग्राहकों को नहीं दिख रहे"}
        </span>
      </h2>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={active ? "Turn duty status off" : "Turn duty status on"}
        onClick={toggle}
        disabled={busy}
        className={`relative mx-auto flex h-32 w-64 items-center rounded-full border-4 transition-colors duration-300 ${
          active
            ? "border-verified-600 bg-verified-500 justify-end"
            : "border-red-700 bg-red-600 justify-start"
        } ${busy ? "opacity-60" : ""}`}
      >
        <span
          className={`flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl shadow-lg transition-transform`}
          aria-hidden
        >
          {active ? "👍" : "✋"}
        </span>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-2xl font-black text-white text-contrast ${active ? "mr-24" : "ml-24"}`}>
            {active ? "ON" : "OFF"}
          </span>
        </span>
      </button>

      <p className="mt-3 text-center text-sm font-semibold text-slate-600">
        {active
          ? `📍 Sharing live location${lastPing ? ` · updated ${lastPing.toLocaleTimeString()}` : ""}`
          : "Tap to start sharing your live location"}
      </p>
      {active && coords && (
        <p className="mt-1 text-center font-mono text-xs font-bold text-verified-700 bg-verified-50 py-1 px-3 rounded-full mx-auto w-fit">
          🛰️ Live GPS: {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-100 p-3 text-center font-semibold text-red-800">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
