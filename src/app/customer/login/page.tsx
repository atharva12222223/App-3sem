"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpLogin } from "@/components/OtpLogin";
import { getSession } from "@/lib/api-client";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (getSession()?.role === "CUSTOMER") router.replace("/customer");
  }, [router]);

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <OtpLogin
        role="CUSTOMER"
        icon="📍"
        title="Customer Login"
        subtitle="ग्राहक लॉगिन — save favorites & review vendors"
        onLoggedIn={() => router.replace("/customer")}
      />
    </main>
  );
}
