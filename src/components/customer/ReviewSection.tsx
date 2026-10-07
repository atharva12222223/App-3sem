"use client";

// Review list + "write a review" form. Requires CUSTOMER login; shows a
// login prompt (link) when signed out.
import { useState } from "react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { api, getSession } from "@/lib/api-client";

export type ReviewRecord = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { name: string | null };
};

export function ReviewSection({
  vendorPhone,
  reviews,
  onSubmitted,
}: {
  vendorPhone: string;
  reviews: ReviewRecord[];
  onSubmitted: () => void;
}) {
  const loggedIn = getSession()?.role === "CUSTOMER";
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/vendors/${vendorPhone}/reviews`, {
        method: "POST",
        auth: true,
        body: { rating, comment: comment || undefined },
      });
      setRating(0);
      setComment("");
      onSubmitted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-extrabold text-civic-900">
        ⭐ Ratings & Reviews <span className="text-sm font-semibold text-slate-500">समीक्षा</span>
      </h2>

      {loggedIn ? (
        <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-4 shadow">
          <p className="text-sm font-bold text-slate-700">Your rating / आपकी रेटिंग:</p>
          <StarRating value={rating} onChange={setRating} size="lg" />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="How was the food / produce / service? (optional)"
            className="w-full rounded-xl border-2 border-slate-300 px-3 py-2 focus:border-civic-600 focus:outline-none"
          />
          {error && (
            <p role="alert" className="rounded-lg bg-red-100 p-2 text-sm font-semibold text-red-800">
              ⚠️ {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || rating === 0}
            className="w-full rounded-xl bg-civic-600 py-3 font-extrabold text-white disabled:opacity-50"
          >
            {busy ? "Submitting…" : "📤 Submit Review"}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center">
          <p className="font-semibold text-slate-600">Login to rate & review this vendor</p>
          <Link
            href="/customer/login"
            className="mt-2 inline-block rounded-xl bg-civic-600 px-6 py-3 font-extrabold text-white"
          >
            🔑 Login with OTP
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {reviews.length === 0 && (
          <li className="rounded-2xl bg-white p-4 text-center text-slate-500 shadow">
            No reviews yet — be the first! 🎉
          </li>
        )}
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                {r.customer.name ?? "Customer"}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(r.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
            <StarRating value={r.rating} readOnly size="sm" />
            {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
