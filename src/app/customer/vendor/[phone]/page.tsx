"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, getSession } from "@/lib/api-client";
import { categoryInfo } from "@/lib/categories";
import { formatDistance, haversineKm } from "@/lib/geo";
import { VerifiedBadge } from "@/components/customer/VerifiedBadge";
import { StarRating } from "@/components/customer/StarRating";
import { UPIPayButton } from "@/components/customer/UPIPayButton";
import { ReviewSection, ReviewRecord } from "@/components/customer/ReviewSection";

const MapView = dynamic(
  () => import("@/components/customer/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-slate-200" /> }
);

type VendorDetail = {
  phone: string;
  name: string;
  nameVernacular?: string | null;
  category: string;
  verificationStatus: string;
  upiId?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating: number;
  ratingCount: number;
  dutyActive: boolean;
  lastPingAt?: string | null;
  zone?: { name: string } | null;
};

export default function VendorDetailPage() {
  const { phone } = useParams<{ phone: string }>();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  const load = useCallback(async () => {
    const [vRes, rRes] = await Promise.all([
      api<{ vendor: VendorDetail }>(`/api/vendors/${phone}`),
      api<{ reviews: ReviewRecord[] }>(`/api/vendors/${phone}/reviews`),
    ]);
    setVendor(vRes.vendor);
    setReviews(rRes.reviews);

    if (vRes.vendor.lat != null && vRes.vendor.lng != null && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setDistanceKm(
            haversineKm(pos.coords.latitude, pos.coords.longitude, vRes.vendor.lat!, vRes.vendor.lng!)
          ),
        () => {}
      );
    }
  }, [phone]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  // Favorite state
  useEffect(() => {
    if (getSession()?.role !== "CUSTOMER") return;
    api<{ favorites: { vendorPhone: string }[] }>("/api/customers/me/favorites", { auth: true })
      .then((res) => setIsFavorite(res.favorites.some((f) => f.vendorPhone === phone)))
      .catch(() => {});
  }, [phone]);

  async function toggleFavorite() {
    setFavBusy(true);
    try {
      if (isFavorite) {
        await api(`/api/customers/me/favorites?vendorPhone=${phone}`, {
          method: "DELETE",
          auth: true,
        });
        setIsFavorite(false);
      } else {
        await api("/api/customers/me/favorites", {
          method: "POST",
          auth: true,
          body: { vendorPhone: phone },
        });
        setIsFavorite(true);
      }
    } finally {
      setFavBusy(false);
    }
  }

  if (!vendor) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-bold text-slate-500">Loading vendor…</p>
      </main>
    );
  }

  const cat = categoryInfo(vendor.category);

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg space-y-4 px-4 py-4 pb-safe pt-safe">
      <Link href="/customer" className="inline-block text-sm font-bold text-civic-600 underline">
        ← Back to map / नक्शे पर वापस
      </Link>

      {/* Vendor detail card */}
      <article className="rounded-3xl bg-white p-5 shadow-lg">
        <div className="flex items-start gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-4xl"
            aria-hidden
          >
            {cat.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">{vendor.name}</h1>
              {vendor.verificationStatus === "APPROVED" && <VerifiedBadge />}
            </div>
            {vendor.nameVernacular && (
              <p className="text-slate-500">{vendor.nameVernacular}</p>
            )}
            <p className="mt-1 text-sm font-bold text-slate-600">
              {cat.en} · {cat.hi}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-bold">
          <div className="rounded-xl bg-amber-50 p-3">
            <StarRating value={vendor.rating} readOnly size="sm" />
            <p className="mt-1 text-amber-700">
              {vendor.rating > 0 ? `${vendor.rating.toFixed(1)} ★ (${vendor.ratingCount})` : "New"}
            </p>
          </div>
          <div className="rounded-xl bg-civic-50 p-3">
            <p className="text-2xl" aria-hidden>📍</p>
            <p className="mt-1 text-civic-700">
              {distanceKm != null ? formatDistance(distanceKm) : "—"}
            </p>
          </div>
          <div className={`rounded-xl p-3 ${vendor.dutyActive ? "bg-green-50" : "bg-slate-50"}`}>
            <p className="text-2xl" aria-hidden>{vendor.dutyActive ? "🟢" : "🔴"}</p>
            <p className={`mt-1 ${vendor.dutyActive ? "text-green-700" : "text-slate-500"}`}>
              {vendor.dutyActive ? "Open now" : "Closed"}
            </p>
          </div>
        </div>

        {vendor.zone && (
          <p className="mt-3 text-sm text-slate-500">
            🏛️ Authorized vending zone: <strong>{vendor.zone.name}</strong>
          </p>
        )}

        <button
          type="button"
          onClick={toggleFavorite}
          disabled={favBusy || getSession()?.role !== "CUSTOMER"}
          className={`mt-4 w-full rounded-xl border-2 py-3 font-extrabold transition ${
            isFavorite
              ? "border-amber-400 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-amber-400"
          } disabled:opacity-50`}
        >
          {getSession()?.role !== "CUSTOMER"
            ? "❤️ Login to save as favorite"
            : isFavorite
              ? "💛 Saved as favorite"
              : "🤍 Save as favorite"}
        </button>
      </article>

      {/* Mini map */}
      {vendor.lat != null && vendor.lng != null && (
        <div className="h-48 overflow-hidden rounded-3xl shadow">
          <MapView
            vendors={[{
              phone: vendor.phone,
              name: vendor.name,
              category: vendor.category,
              lat: vendor.lat!,
              lng: vendor.lng!,
              rating: vendor.rating,
              distanceKm,
            }]}
            zones={[]}
            userPos={null}
            focusVendor={[vendor.lat, vendor.lng]}
          />
        </div>
      )}

      {/* UPI payment */}
      {vendor.upiId ? (
        <UPIPayButton upiId={vendor.upiId} payeeName={vendor.name} />
      ) : (
        <div className="rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-500 shadow">
          💳 This vendor has not linked a UPI ID yet. Pay cash or ask them to add one.
        </div>
      )}

      {/* Reviews */}
      <ReviewSection vendorPhone={vendor.phone} reviews={reviews} onSubmitted={load} />
    </main>
  );
}
