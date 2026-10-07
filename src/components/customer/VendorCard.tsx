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
    <Link
      href={`/customer/vendor/${vendor.phone}`}
      className="block rounded-2xl bg-white p-4 shadow transition hover:shadow-lg active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl"
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
          <p className="mt-0.5 text-sm font-semibold text-slate-600">
            {cat.en} · {cat.hi}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold">
            <span className="flex items-center gap-1 text-amber-600">
              <StarRating value={vendor.rating} readOnly size="sm" />
              {vendor.rating > 0 ? `${vendor.rating.toFixed(1)} (${vendor.ratingCount})` : "New"}
            </span>
            {vendor.distanceKm != null && (
              <span className="text-slate-500">📍 {formatDistance(vendor.distanceKm)}</span>
            )}
            {vendor.dutyActive ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-extrabold text-green-800">
                🟢 Open now
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-extrabold text-slate-500">
                🔴 Closed
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
