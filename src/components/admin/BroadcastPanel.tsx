"use client";

// Broadcast composer + history. Audience can target all vendors, a zone,
// or a category. Delivery is stubbed (console) — wire FCM + an SMS gateway
// (MSG91/Gupshup) in production.
import { useState } from "react";
import { api } from "@/lib/api-client";

export type BroadcastRecord = {
  id: string;
  title: string;
  message: string;
  audience: string;
  channel: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  sentBy?: { name: string; department: string } | null;
};

const QUICK_TEMPLATES = [
  { icon: "🚧", title: "Traffic Diversion", message: "Advisory: Road work near your vending zone tomorrow 10 AM–4 PM. Please relocate to the alternate spot marked by the ward officer." },
  { icon: "🧼", title: "Health Guidelines", message: "Reminder from the Town Vending Committee: maintain 2 m spacing between carts, use gloves for ready-to-eat food, and keep waste bins covered." },
  { icon: "🌧️", title: "Weather Alert", message: "IMD has issued a heavy rain alert for the next 48 hours. Secure your carts and avoid vending near drains and low-lying areas." },
  { icon: "📅", title: "Survey / Meeting Notice", message: "Town Vending Committee meeting this Saturday 11 AM at the ward office. All registered vendors are requested to attend with their vendor ID." },
];

export function BroadcastPanel({
  zones,
  history,
  onSent,
}: {
  zones: { id: string; name: string }[];
  history: BroadcastRecord[];
  onSent: () => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("ALL_VENDORS");
  const [channel, setChannel] = useState("PUSH_SMS");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult("");
    try {
      const res = await api<{ broadcast: BroadcastRecord; recipientCount: number }>(
        "/api/admin/broadcast",
        { method: "POST", auth: true, body: { title, message, audience, channel } }
      );
      setResult(`✅ Sent "${res.broadcast.title}" to ${res.recipientCount} vendors via ${res.broadcast.channel}`);
      setTitle("");
      setMessage("");
      onSent();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={send} className="space-y-4 rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-extrabold text-civic-900">📢 New Broadcast</h2>

        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">Quick templates:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_TEMPLATES.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => {
                  setTitle(t.title);
                  setMessage(t.message);
                }}
                className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:border-civic-600"
              >
                {t.icon} {t.title}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-slate-700" htmlFor="bc-title">
            Title / शीर्षक
          </label>
          <input
            id="bc-title"
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Traffic Diversion Advisory"
            className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 font-semibold focus:border-civic-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-slate-700" htmlFor="bc-msg">
            Message / संदेश <span className="font-normal text-slate-400">(SMS-safe: keep under 300 chars)</span>
          </label>
          <textarea
            id="bc-msg"
            required
            rows={4}
            maxLength={300}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 focus:border-civic-600 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs font-semibold text-slate-400">
            {message.length}/300
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700" htmlFor="bc-aud">
              Audience / श्रोता
            </label>
            <select
              id="bc-aud"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 font-semibold focus:border-civic-600 focus:outline-none"
            >
              <option value="ALL_VENDORS">👥 All registered vendors</option>
              {zones.map((z) => (
                <option key={z.id} value={`ZONE:${z.id}`}>
                  🗺️ Zone: {z.name}
                </option>
              ))}
              <option value="CATEGORY:FOOD">🍛 Category: Food</option>
              <option value="CATEGORY:CHAAT">🥘 Category: Chaat</option>
              <option value="CATEGORY:VEGETABLES">🥬 Category: Vegetables</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-slate-700">Channel / माध्यम</p>
            <div className="flex gap-2">
              {[
                { id: "PUSH", label: "📲 Push" },
                { id: "SMS", label: "✉️ SMS" },
                { id: "PUSH_SMS", label: "Both" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannel(c.id)}
                  aria-pressed={channel === c.id}
                  className={`flex-1 rounded-xl border-2 px-2 py-2.5 text-sm font-extrabold ${
                    channel === c.id
                      ? "border-civic-600 bg-civic-600 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">⚠️ {error}</p>
        )}
        {result && (
          <p role="status" className="rounded-lg bg-green-100 p-3 font-semibold text-green-800">{result}</p>
        )}

        <button
          type="submit"
          disabled={busy || !title || !message}
          className="w-full rounded-xl bg-civic-900 py-3.5 text-lg font-extrabold text-white shadow disabled:opacity-50"
        >
          {busy ? "Sending…" : "🚀 Send Broadcast"}
        </button>
      </form>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-3 text-lg font-extrabold text-civic-900">🕘 Broadcast History</h2>
        <ul className="space-y-3">
          {history.length === 0 && (
            <li className="text-sm text-slate-500">No broadcasts sent yet.</li>
          )}
          {history.map((b) => (
            <li key={b.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-extrabold text-slate-800">{b.title}</p>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                    b.status === "SENT" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{b.message}</p>
              <p className="mt-1.5 text-xs font-semibold text-slate-400">
                {b.channel} · {b.audience}
                {b.sentAt && ` · ${new Date(b.sentAt).toLocaleString("en-IN")}`}
                {b.sentBy && ` · by ${b.sentBy.name}`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
