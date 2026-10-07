import Link from "next/link";
import Image from "next/image";
import { LanguageToggle } from "@/components/LanguageToggle";
import { IosInstallPrompt } from "@/components/IosInstallPrompt";

const portals = [
  {
    href: "/vendor",
    icon: "🛒",
    title: "I am a Vendor",
    subtitle: "विक्रेता — Register, get your Digital ID & QR",
    bg: "bg-vendor-600",
  },
  {
    href: "/customer",
    icon: "📍",
    title: "I am a Customer",
    subtitle: "ग्राहक — Find verified street vendors near you",
    bg: "bg-civic-600",
  },
  {
    href: "/admin",
    icon: "🏛️",
    title: "Municipal Admin",
    subtitle: "नगरपालिका — Verify vendors, zones & broadcasts",
    bg: "bg-slate-800",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-6 pb-safe pt-safe">
      <header className="text-center pt-2">
        <div className="mx-auto mb-4 relative h-20 w-20 overflow-hidden rounded-[22%] shadow-xl border-2 border-white/80 ring-1 ring-slate-900/10 transition-transform active:scale-95">
          <Image
            src="/apple-touch-icon.png"
            alt="Sadak Vyapar Icon"
            width={80}
            height={80}
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-civic-900">
          Sadak Vyapar
        </h1>
        <p className="mt-1 text-base font-medium text-slate-600">
          Street Vendor Digital Registry <br />
          <span className="text-sm">स्ट्रीट वेंडर डिजिटल रजिस्ट्री</span>
        </p>
      </header>

      <IosInstallPrompt />

      <nav className="flex flex-col gap-4" aria-label="Choose your portal">
        {portals.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`${p.bg} flex items-center gap-4 rounded-2xl p-5 text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98]`}
          >
            <span className="text-4xl" aria-hidden>{p.icon}</span>
            <span>
              <span className="block text-xl font-bold">{p.title}</span>
              <span className="block text-sm opacity-90">{p.subtitle}</span>
            </span>
            <span className="ml-auto text-2xl" aria-hidden>→</span>
          </Link>
        ))}
      </nav>

      <footer className="mt-auto space-y-4 rounded-2xl bg-white p-4 shadow">
        <LanguageToggle />
        <p className="text-center text-xs text-slate-500">
          An initiative aligned with the Street Vendors Act, 2014 · PM SVANidhi
        </p>
      </footer>
    </main>
  );
}
