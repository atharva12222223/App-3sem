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
    PENDING: { label: "⏳ Under Review", cls: "bg-amber-100 text-amber-900 border border-amber-300" },
    APPROVED: { label: "✓ Approved", cls: "bg-green-100 text-green-900 border border-green-300" },
    REJECTED: { label: "✗ Rejected", cls: "bg-red-100 text-red-900 border border-red-300" },
  };
  const s = map[status] ?? map.PENDING;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${s.cls}`}>{s.label}</span>;
}

async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const maxDimension = 1600;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
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

  async function upload(type: string, rawFile: File) {
    setError("");
    setUploading(type);
    try {
      const file = await compressImageIfNeeded(rawFile);
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
    <div className="space-y-3">
      <h2 className="text-base font-extrabold text-civic-900">
        📄 KYC Documents <span className="text-sm font-semibold text-slate-500">/ सत्यापन दस्तावेज़</span>
      </h2>
      {error && (
        <p role="alert" className="rounded-xl bg-red-100 p-3 text-xs font-bold text-red-800">
          ⚠️ {error}
        </p>
      )}
      {DOC_DEFS.map((def) => {
        const existing = documents.find((d) => d.type === def.type);
        return (
          <div
            key={def.type}
            className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100"
          >
            <span className="text-3xl shrink-0" aria-hidden>{def.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-sm leading-tight text-slate-900">{def.en}</p>
              <p className="text-xs font-semibold text-slate-500">{def.hi}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{def.hint}</p>
              {existing && (
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusPill status={existing.status} />
                  <a
                    href={existing.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-civic-600 underline hover:text-civic-800"
                  >
                    View Doc ↗
                  </a>
                </div>
              )}
            </div>
            <label
              className={`cursor-pointer shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-white shadow transition active:scale-95 ${
                existing ? "bg-slate-600 hover:bg-slate-700" : "bg-civic-600 hover:bg-civic-700"
              } ${uploading === def.type ? "opacity-60 pointer-events-none" : ""}`}
            >
              {uploading === def.type
                ? "⏳ Uploading…"
                : existing
                  ? "🔄 Re-take"
                  : "📸 Snap / Upload"}
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
