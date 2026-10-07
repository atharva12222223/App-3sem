"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, clearSession, getSession } from "@/lib/api-client";
import { VendorRegistration } from "@/components/vendor/VendorRegistration";
import { DutyStatusToggle } from "@/components/vendor/DutyStatusToggle";
import { DigitalIdCard } from "@/components/vendor/DigitalIdCard";
import { DocumentUpload, DocRecord } from "@/components/vendor/DocumentUpload";
import { LanguageToggle } from "@/components/LanguageToggle";

type MeVendor = {
  phone: string;
  name: string;
  nameVernacular?: string | null;
  category: string;
  verificationStatus: string;
  rejectionReason?: string | null;
  rating: number;
  ratingCount: number;
  dutyActive: boolean;
  documents: DocRecord[];
};

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [vendor, setVendor] = useState<MeVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionPhone, setSessionPhone] = useState("");

  const load = useCallback(async () => {
    const session = getSession();
    if (!session || session.role !== "VENDOR") {
      router.replace("/vendor");
      return;
    }
    setSessionPhone(session.phone);
    try {
      const res = await api<{ vendor: MeVendor | null }>("/api/vendors/me", { auth: true });
      setVendor(res.vendor);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-lg font-bold text-slate-500">Loading… / लोड हो रहा है…</p>
      </main>
    );
  }

  // New vendor (or ?register=1) → registration flow
  if (!vendor || params.get("register") === "1" && !vendor) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md px-4 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="mb-1 text-center text-2xl font-extrabold text-civic-900">
            🛒 New Vendor Registration
          </h1>
          <p className="mb-6 text-center text-slate-500">नया विक्रेता पंजीकरण</p>
          <VendorRegistration phone={sessionPhone} onRegistered={load} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-4 px-4 py-6 pb-safe pt-safe">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50">
          ← Back to Home / मुख्य पृष्ठ
        </Link>
        <button
          onClick={() => {
            clearSession();
            router.replace("/vendor");
          }}
          className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50"
        >
          Logout ↩
        </button>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-civic-900">Namaste, {vendor.name.split(" ")[0]} 🙏</h1>
          <p className="text-sm font-semibold text-slate-500">+{vendor.phone}</p>
        </div>
      </header>

      {vendor.verificationStatus === "PENDING" && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
          <p className="font-extrabold text-amber-900">⏳ Verification Pending</p>
          <p className="text-sm font-semibold text-amber-800">
            Municipal officer will check your documents soon.
            <br />नगरपालिका अधिकारी जल्द ही आपके दस्तावेज़ जाँचेंगे।
          </p>
        </div>
      )}
      {vendor.verificationStatus === "REJECTED" && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-center">
          <p className="font-extrabold text-red-900">✗ Verification Rejected</p>
          <p className="text-sm font-semibold text-red-800">
            {vendor.rejectionReason ?? "Please re-upload clear documents."}
          </p>
        </div>
      )}

      <DutyStatusToggle initial={vendor.dutyActive} />

      <DigitalIdCard vendor={vendor} />

      <DocumentUpload documents={vendor.documents} onUploaded={load} />

      <section className="rounded-2xl bg-white p-4 shadow">
        <h2 className="mb-2 text-sm font-extrabold text-civic-900">🌐 भाषा / Language</h2>
        <LanguageToggle />
      </section>

      <nav className="text-center">
        <Link href="/" className="text-sm font-bold text-slate-500 underline">
          ← Home / होम
        </Link>
      </nav>
    </main>
  );
}

export default function VendorDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="animate-pulse font-bold text-slate-500">Loading…</p>
        </main>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
