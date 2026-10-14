import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PwaRegister } from "@/components/PwaRegister";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "Sadak Vyapar — Street Vendor Digital Registry",
  description:
    "Digital registry and customer discovery portal for street vendors, customers, and municipal administrations in India.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sadak Vyapar",
  },
  icons: {
    icon: "/favicon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="pb-16 sm:pb-0">
        <LanguageProvider>
          <PwaRegister />
          {children}
          <MobileBottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
