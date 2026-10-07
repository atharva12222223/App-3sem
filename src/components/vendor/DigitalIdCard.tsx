"use client";

// Digital Vendor ID card with a scannable QR code. The QR encodes the
// vendor's public profile URL so customers can scan → view card → pay UPI.
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { categoryInfo } from "@/lib/categories";

export type DigitalIdVendor = {
  phone: string;
  name: string;
  nameVernacular?: string | null;
  category: string;
  verificationStatus: string;
  rating: number;
  ratingCount: number;
};

export function DigitalIdCard({ vendor }: { vendor: DigitalIdVendor }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrError, setQrError] = useState(false);
  const cat = categoryInfo(vendor.category);
  const digitalId = `SVY-${vendor.phone.slice(-8)}`;
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/customer/vendor/${vendor.phone}`
      : `/customer/vendor/${vendor.phone}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, profileUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).catch(() => setQrError(true));
  }, [profileUrl]);

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-civic-900 to-civic-600 p-5 text-white shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">
            🪪 Digital Vendor ID / डिजिटल विक्रेता पहचान
          </p>
          <p className="mt-1 font-mono text-xl font-black tracking-wider">{digitalId}</p>
        </div>
        <span className="text-4xl" aria-hidden>{cat.icon}</span>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-lg font-extrabold leading-tight">{vendor.name}</p>
            {vendor.nameVernacular && (
              <p className="text-base opacity-90">{vendor.nameVernacular}</p>
            )}
          </div>
          <p className="text-sm font-semibold opacity-90">
            {cat.icon} {cat.en} · {cat.hi}
          </p>
          {vendor.verificationStatus === "APPROVED" ? (
            <p className="inline-flex items-center gap-1 rounded-full bg-verified-500 px-3 py-1 text-xs font-extrabold">
              ✓ Municipality Verified / सत्यापित
            </p>
          ) : (
            <p className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold text-amber-950">
              ⏳ Verification Pending / लंबित
            </p>
          )}
          <p className="text-sm opacity-90">
            ⭐ {vendor.rating.toFixed(1)} ({vendor.ratingCount} reviews)
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="rounded-xl bg-white p-2">
            {qrError ? (
              <p className="w-[132px] p-4 text-center text-xs font-bold text-red-700">
                QR unavailable
              </p>
            ) : (
              <canvas ref={canvasRef} className="h-[132px] w-[132px]" aria-label={`QR code linking to ${vendor.name}'s public profile`} />
            )}
          </div>
          <button
            type="button"
            onClick={() => canvasRef.current?.toBlob((b) => {
              if (!b) return;
              const url = URL.createObjectURL(b);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${digitalId}-qr.png`;
              a.click();
              URL.revokeObjectURL(url);
            })}
            className="rounded-lg bg-white/20 px-3 py-2 text-xs font-bold backdrop-blur hover:bg-white/30"
          >
            ⬇️ Save QR (print & display)
          </button>
        </div>
      </div>
    </div>
  );
}
