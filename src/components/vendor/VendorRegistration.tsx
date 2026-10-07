"use client";

// Icon-first registration form for new vendors. Big tap targets, category
// picker uses pictures + bilingual labels so it works with low literacy.
import { useState } from "react";
import { CATEGORIES, CategoryId } from "@/lib/categories";
import { api } from "@/lib/api-client";

export function VendorRegistration({
  phone,
  onRegistered,
}: {
  phone: string;
  onRegistered: () => void;
}) {
  const [name, setName] = useState("");
  const [nameVernacular, setNameVernacular] = useState("");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [upiId, setUpiId] = useState("");
  const [useLiveLocation, setUseLiveLocation] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(lat?: number, lng?: number) {
    setError("");
    setBusy(true);
    try {
      await api("/api/vendors", {
        method: "POST",
        auth: true,
        body: { name, nameVernacular: nameVernacular || undefined, category, upiId: upiId || undefined, lat, lng },
      });
      onRegistered();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (useLiveLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => submit(pos.coords.latitude, pos.coords.longitude),
        () => submit() // location denied — register without coordinates
      );
    } else {
      submit();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor="vname">
          🏪 Your Shop / Cart Name <span className="text-slate-500">दुकान का नाम</span>
        </label>
        <input
          id="vname"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ramesh Chaat Bhandar"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg focus:border-vendor-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor="vname-local">
          ✍️ Name in your language <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="vname-local"
          value={nameVernacular}
          onChange={(e) => setNameVernacular(e.target.value)}
          placeholder="रमेश चाट भंडार / ರಮೇಶ್ ಚಾಟ್"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg focus:border-vendor-600 focus:outline-none"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">
          🧺 What do you sell? <span className="text-slate-500">आप क्या बेचते हैं?</span>
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              aria-pressed={category === c.id}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition ${
                category === c.id
                  ? "border-vendor-600 bg-vendor-50 shadow-md"
                  : "border-slate-200 bg-white"
              }`}
            >
              <span className="text-3xl" aria-hidden>{c.icon}</span>
              <span className="text-xs font-bold leading-tight text-center">{c.en}</span>
              <span className="text-[10px] text-slate-500">{c.hi}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor="vupi">
          💳 UPI ID <span className="text-slate-500">(for receiving payments)</span>
        </label>
        <input
          id="vupi"
          inputMode="text"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="9876543210@ybl"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg focus:border-vendor-600 focus:outline-none"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={useLiveLocation}
          onChange={(e) => setUseLiveLocation(e.target.checked)}
          className="h-6 w-6 accent-vendor-600"
        />
        <span className="font-semibold">
          📍 Use my current location
          <span className="block text-sm font-normal text-slate-500">
            मेरा वर्तमान स्थान उपयोग करें
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">
          ⚠️ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !name || !category}
        className="w-full rounded-xl bg-vendor-600 py-4 text-lg font-extrabold text-white shadow-lg disabled:opacity-50"
      >
        {busy ? "Registering…" : "✅ Register / रजिस्टर करें"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Registered with phone: <strong>+{phone}</strong>
      </p>
    </form>
  );
}
