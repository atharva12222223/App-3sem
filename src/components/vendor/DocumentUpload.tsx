"use client";

// KYC document upload: Aadhaar, FSSAI licence, municipal certificate.
// Camera-first (capture attribute) since most vendors will photograph docs.
import { useState } from "react";
import { api } from "@/lib/api-client";

export type DocRecord = {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  uploadedAt: string;
};

const DOC_DEFS = [
  {
    type: "AADHAAR",
    icon: "🪪",
    en: "Aadhaar Card",
    hi: "आधार कार्ड",
    hint: "Photo of front side / सामने की फोटो",
  },
  {
    type: "FSSAI",
    icon: "🍽️",
    en: "FSSAI Food License",
    hi: "एफएसएसएआई लाइसेंस",
    hint: "Only needed for food vendors / केवल खाद्य विक्रेताओं के लिए",
  },
  {
    type: "MUNICIPAL_CERT",
    icon: "🏛️",
    en: "Municipal Certificate",
    hi: "नगरपालिका प्रमाणपत्र",
    hint: "Local vending certificate / स्थानीय वेंडिंग प्रमाणपत्र",
  },
] as const;

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "⏳ Checking", cls: "bg-amber-100 text-amber-900" },
    APPROVED: { label: "✓ Approved", cls: "bg-green-100 text-green-900" },
    REJECTED: { label: "✗ Rejected", cls: "bg-red-100 text-red-900" },
  };
  const s = map[status] ?? map.PENDING;
  return <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${s.cls}`}>{s.label}</span>;
}

export function DocumentUpload({
  documents,
  onUploaded,
}: {
  documents: DocRecord[];
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function upload(type: string, file: File) {
    setError("");
    setUploading(type);
    try {
      const form = new FormData();
      form.append("file", file);
      const { fileUrl } = await api<{ fileUrl: string }>("/api/upload", {
        method: "POST",
        auth: true,
        form,
      });
      await api("/api/vendors/me/documents", {
        method: "POST",
        auth: true,
        body: { type, fileUrl },
      });
      onUploaded();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold text-civic-900">
        📄 KYC Documents <span className="text-sm font-semibold text-slate-500">दस्तावेज़</span>
      </h2>
      {error && (
        <p role="alert" className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">
          ⚠️ {error}
        </p>
      )}
      {DOC_DEFS.map((def) => {
        const existing = documents.find((d) => d.type === def.type);
        return (
          <div
            key={def.type}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow"
          >
            <span className="text-4xl" aria-hidden>{def.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold leading-tight">{def.en}</p>
              <p className="text-sm font-semibold text-slate-500">{def.hi}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{def.hint}</p>
              {existing && (
                <div className="mt-2">
                  <StatusPill status={existing.status} />
                </div>
              )}
            </div>
            <label
              className={`cursor-pointer rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow ${
                existing ? "bg-slate-500 hover:bg-slate-600" : "bg-civic-600 hover:bg-civic-700"
              } ${uploading === def.type ? "opacity-60" : ""}`}
            >
              {uploading === def.type
                ? "⏳…"
                : existing
                  ? "🔄 Re-upload"
                  : "📸 Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                capture="environment"
                className="sr-only"
                disabled={uploading === def.type}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(def.type, f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
