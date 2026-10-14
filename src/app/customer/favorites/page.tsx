"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, getSession } from "@/lib/api-client";
import { VendorCard, VendorCardData } from "@/components/customer/VendorCard";

export default function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState<VendorCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomer, setIsCustomer] = useState(false);
  const [mounted, setMounted] = useState(false);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{
        favorites: {
          vendor: {
            phone: string;
            name: string;
            nameVernacular?: string | null;
            category: string;
            verificationStatus: string;
            rating: number;
            ratingCount: number;
            dutyActive: boolean;
            upiId?: string | null;
            lat?: number | null;
            lng?: number | null;
          };
        }[];
      }>("/api/customers/me/favorites", { auth: true });

      setFavorites(
        res.favorites.map((f) => ({
          ...f.vendor,
          distanceKm: null,
        }))
      );
    } catch {
      // not logged in or error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const session = getSession();
    if (session?.role === "CUSTOMER") {
      setIsCustomer(true);
      loadFavorites();
    } else {
      setIsCustomer(false);
      setLoading(false);
    }
  }, [loadFavorites]);

  if (!mounted) return null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-4 py-6 pb-24 pt-safe">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/customer" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50">
          ← Back to Map
        </Link>
        <h1 className="text-xl font-extrabold text-civic-900">❤️ Saved Vendors</h1>
        <div className="w-16" />
      </header>

      {!isCustomer ? (
        <div className="my-auto rounded-3xl bg-white p-6 text-center shadow-lg">
          <span className="text-5xl" aria-hidden>❤️</span>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            Login to save your favorite street vendors
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Keep track of your favorite chaat stalls, vegetable vendors, and flower carts.
          </p>
          <Link
            href="/customer/login"
            className="mt-6 inline-block w-full rounded-xl bg-civic-600 py-3.5 text-base font-extrabold text-white shadow-md hover:bg-civic-700 active:scale-98 transition"
          >
            Customer Login / ग्राहक लॉगिन
          </Link>
        </div>
      ) : loading ? (
        <div className="py-16 text-center">
          <p className="animate-pulse text-sm font-bold text-slate-500">
            Loading your favorites… / पसंदीदा विक्रेता लोड हो रहे हैं…
          </p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="my-auto rounded-3xl bg-white p-8 text-center shadow-md">
          <span className="text-5xl" aria-hidden>🛍️</span>
          <h2 className="mt-4 text-lg font-extrabold text-slate-800">
            No saved vendors yet
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Browse the map or list, tap any vendor card, and tap &quot;Save as favorite&quot; to find them quickly here anytime.
          </p>
          <Link
            href="/customer"
            className="mt-6 inline-block rounded-xl bg-civic-600 px-6 py-3 text-sm font-extrabold text-white shadow hover:bg-civic-700"
          >
            🗺️ Explore Vendors Near You
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {favorites.length} Saved {favorites.length === 1 ? "Vendor" : "Vendors"}
          </p>
          {favorites.map((v) => (
            <VendorCard key={v.phone} vendor={v} />
          ))}
        </div>
      )}
    </main>
  );
}
