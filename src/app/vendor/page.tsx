"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OtpLogin } from "@/components/OtpLogin";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getSession } from "@/lib/api-client";

export default function VendorLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (getSession()?.role === "VENDOR") router.replace("/vendor/dashboard");
  }, [router]);

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <Link href="/" className="text-sm font-bold text-slate-500 underline">
        ← Back / वापस
      </Link>
      <OtpLogin
        role="VENDOR"
        icon="🛒"
        title="Vendor Login"
        subtitle="विक्रेता लॉगिन — Enter your mobile number to continue"
        onLoggedIn={({ isNewVendor }) =>
          router.push(isNewVendor ? "/vendor/dashboard?register=1" : "/vendor/dashboard")
        }
      />
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow">
        <LanguageToggle />
      </div>
    </main>
  );
}
