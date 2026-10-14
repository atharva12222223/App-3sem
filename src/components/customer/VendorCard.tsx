"use client";

import Link from "next/link";
import { categoryInfo } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import { VerifiedBadge } from "./VerifiedBadge";
import { StarRating } from "./StarRating";

export type VendorCardData = {
  phone: string;
  name: string;
  nameVernacular?: string | null;
  category: string;
  verificationStatus: string;
  rating: number;
  ratingCount: number;
  distanceKm: number | null;
  dutyActive: boolean;
  upiId?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export function VendorCard({ vendor }: { vendor: VendorCardData }) {
  const cat = categoryInfo(vendor.category);
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <Link
        href={`/customer/vendor/${vendor.phone}`}
        className="block active:opacity-90"
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-3xl border border-slate-100 shadow-inner"
            aria-hidden
          >
            {cat.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-extrabold text-slate-900">{vendor.name}</h3>
              {vendor.verificationStatus === "APPROVED" && <VerifiedBadge />}
            </div>
            {vendor.nameVernacular && (
              <p className="truncate text-sm text-slate-500">{vendor.nameVernacular}</p>
            )}
            <p className="mt-0.5 text-xs font-bold text-slate-600">
              {cat.en} · {cat.hi}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold">
              <span className="flex items-center gap-1 text-amber-600">
                <StarRating value={vendor.rating} readOnly size="sm" />
                {vendor.rating > 0 ? `${vendor.rating.toFixed(1)} (${vendor.ratingCount})` : "New"}
              </span>
              {vendor.distanceKm != null && (
                <span className="text-slate-500">📍 {formatDistance(vendor.distanceKm)}</span>
              )}
              {vendor.dutyActive ? (
                <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[11px] font-extrabold text-green-700">
                  🟢 Open now
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-500">
                  🔴 Closed
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Action Buttons for mobile */}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
        <Link
          href={`/customer/vendor/${vendor.phone}`}
          className="flex-1 rounded-xl bg-civic-50 py-2 text-center text-xs font-extrabold text-civic-800 hover:bg-civic-100 active:scale-98 transition"
        >
          View Profile & Reviews →
        </Link>
        {vendor.lat != null && vendor.lng != null && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${vendor.lat},${vendor.lng}`}
            target="_blank"
            rel="noreferrer"
            title="Directions"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            🧭
          </a>
        )}
        <a
          href={`tel:+${vendor.phone}`}
          title="Call Vendor"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
        >
          📞
        </a>
      </div>
    </div>
  );
}
