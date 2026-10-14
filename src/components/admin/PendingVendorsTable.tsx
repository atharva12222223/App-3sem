"use client";

// Data table of pending vendor registrations with KYC document review
// and Approve / Reject actions. Responsive: table on desktop, stacked
// cards on small screens.
import { useState } from "react";
import { api } from "@/lib/api-client";
import { categoryInfo } from "@/lib/categories";

export type PendingVendor = {
  phone: string;
  name: string;
  category: string;
  upiId?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  zone?: { name: string } | null;
  documents: { id: string; type: string; fileUrl: string; status: string }[];
};

const DOC_LABELS: Record<string, string> = {
  AADHAAR: "🪪 Aadhaar",
  FSSAI: "🍽️ FSSAI",
  MUNICIPAL_CERT: "🏛️ Municipal Cert",
};

export function PendingVendorsTable({
  vendors,
  onDecided,
}: {
  vendors: PendingVendor[];
  onDecided: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function decide(phone: string, action: "APPROVE" | "REJECT") {
    const reason =
      action === "REJECT"
        ? window.prompt("Rejection reason (sent to vendor via SMS):", "Documents unclear")
        : undefined;
    if (action === "REJECT" && reason === null) return;

    setBusy(phone);
    setError("");
    try {
      await api(`/api/admin/vendors/${phone}`, {
        method: "POST",
        auth: true,
        body: { action, reason },
      });
      onDecided();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(phone: string) {
    if (!window.confirm("Are you sure you want to delete this vendor registration permanently?")) return;
    setBusy(phone);
    setError("");
    try {
      await api(`/api/admin/vendors/${phone}`, {
        method: "DELETE",
        auth: true,
      });
      onDecided();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search) ||
      v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Search Filter for queue */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter queue by name, phone (+91…), category…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-semibold shadow-sm focus:border-civic-600 focus:outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-100 p-3 text-xs font-bold text-red-800">
          ⚠️ {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
          <p className="text-3xl" aria-hidden>📋</p>
          <p className="mt-2 font-bold text-slate-700">No registrations found</p>
          <p className="mt-1 text-xs text-slate-500">
            {search ? "No vendors match your search." : "Queue is empty for this status filter."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-civic-900 text-white">
                <tr>
                  <th className="px-4 py-3 font-extrabold">Vendor</th>
                  <th className="px-4 py-3 font-extrabold">Category</th>
                  <th className="px-4 py-3 font-extrabold">Zone</th>
                  <th className="px-4 py-3 font-extrabold">KYC Documents</th>
                  <th className="px-4 py-3 font-extrabold">Applied</th>
                  <th className="px-4 py-3 font-extrabold text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.phone} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-slate-900">{v.name}</p>
                      <p className="text-xs text-slate-500">+{v.phone}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {categoryInfo(v.category).icon} {categoryInfo(v.category).en}
                    </td>
                    <td className="px-4 py-3">{v.zone?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {v.documents.length === 0 && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-extrabold text-red-800">
                            ✗ None uploaded
                          </span>
                        )}
                        {v.documents.map((d) => (
                          <a
                            key={d.id}
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-civic-50 px-2.5 py-1 text-xs font-extrabold text-civic-700 underline hover:bg-civic-600 hover:text-white"
                          >
                            {DOC_LABELS[d.type] ?? d.type}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(v.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <DecisionButtons phone={v.phone} busy={busy} decide={decide} remove={remove} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((v) => (
              <div key={v.phone} className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {categoryInfo(v.category).icon} {v.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      +{v.phone} · {v.zone?.name ?? "No zone assigned"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Applied: {new Date(v.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <a
                    href={`tel:+${v.phone}`}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
                    title="Call applicant"
                  >
                    📞
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                  <span className="text-xs font-bold text-slate-500 self-center mr-1">KYC Docs:</span>
                  {v.documents.length === 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-extrabold text-red-800">
                      ✗ No documents uploaded
                    </span>
                  ) : (
                    v.documents.map((d) => (
                      <a
                        key={d.id}
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-civic-50 px-2.5 py-0.5 text-xs font-extrabold text-civic-700 underline hover:bg-civic-100"
                      >
                        {DOC_LABELS[d.type] ?? d.type} ↗
                      </a>
                    ))
                  )}
                </div>

                <div className="mt-3.5 flex gap-2 border-t border-slate-100 pt-2.5">
                  <DecisionButtons phone={v.phone} busy={busy} decide={decide} remove={remove} full />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DecisionButtons({
  phone,
  busy,
  decide,
  remove,
  full = false,
}: {
  phone: string;
  busy: string | null;
  decide: (phone: string, action: "APPROVE" | "REJECT") => void;
  remove: (phone: string) => void;
  full?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => decide(phone, "APPROVE")}
        disabled={busy === phone}
        className={`${full ? "flex-1" : ""} rounded-xl bg-verified-500 px-3.5 py-2.5 text-xs font-extrabold text-white shadow hover:bg-verified-600 disabled:opacity-50 active:scale-95 transition`}
      >
        ✓ Approve
      </button>
      <button
        type="button"
        onClick={() => decide(phone, "REJECT")}
        disabled={busy === phone}
        className={`${full ? "flex-1" : ""} rounded-xl bg-amber-500 px-3.5 py-2.5 text-xs font-extrabold text-white shadow hover:bg-amber-600 disabled:opacity-50 active:scale-95 transition`}
      >
        ✗ Reject
      </button>
      <button
        type="button"
        onClick={() => remove(phone)}
        disabled={busy === phone}
        className="rounded-xl bg-red-50 text-red-600 border border-red-200 px-3 py-2.5 text-xs font-extrabold hover:bg-red-100 disabled:opacity-50 active:scale-95 transition"
        title="Delete registration permanently"
      >
        🗑️
      </button>
    </>
  );
}
