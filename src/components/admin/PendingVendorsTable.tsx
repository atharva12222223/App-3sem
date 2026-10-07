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

  if (vendors.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow">
        <p className="text-4xl" aria-hidden>🎉</p>
        <p className="mt-2 font-bold text-slate-700">No pending registrations</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">
          ⚠️ {error}
        </p>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow lg:block">
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
            {vendors.map((v) => (
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
        {vendors.map((v) => (
          <div key={v.phone} className="rounded-2xl bg-white p-4 shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-extrabold text-slate-900">
                  {categoryInfo(v.category).icon} {v.name}
                </p>
                <p className="text-xs text-slate-500">
                  +{v.phone} · {v.zone?.name ?? "No zone"} ·{" "}
                  {new Date(v.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {v.documents.length === 0 ? (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-extrabold text-red-800">
                  ✗ No documents
                </span>
              ) : (
                v.documents.map((d) => (
                  <a
                    key={d.id}
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-civic-50 px-2.5 py-1 text-xs font-extrabold text-civic-700 underline"
                  >
                    {DOC_LABELS[d.type] ?? d.type}
                  </a>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <DecisionButtons phone={v.phone} busy={busy} decide={decide} remove={remove} full />
            </div>
          </div>
        ))}
      </div>
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
        className={`${full ? "flex-1" : ""} rounded-xl bg-verified-500 px-3.5 py-2 text-xs font-extrabold text-white shadow hover:bg-verified-600 disabled:opacity-50`}
      >
        ✓ Approve
      </button>
      <button
        type="button"
        onClick={() => decide(phone, "REJECT")}
        disabled={busy === phone}
        className={`${full ? "flex-1" : ""} rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-white shadow hover:bg-amber-600 disabled:opacity-50`}
      >
        ✗ Reject
      </button>
      <button
        type="button"
        onClick={() => remove(phone)}
        disabled={busy === phone}
        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white shadow hover:bg-red-700 disabled:opacity-50"
        title="Delete registration permanently"
      >
        🗑️
      </button>
    </>
  );
}
