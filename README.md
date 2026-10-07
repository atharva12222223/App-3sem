# Sadak Vyapar — Street Vendor Digital Registry & Customer Discovery Portal

A mobile-first, accessible full-stack boilerplate for digitizing street vending in India, aligned with the **Street Vendors Act, 2014** and **PM SVANidhi**. Three interfaces in one Next.js app:

| Portal | Route | Purpose |
|---|---|---|
| 🛒 **Vendor** | `/vendor` | OTP onboarding, Digital ID + QR, KYC uploads, giant Duty Status toggle (live location) |
| 📍 **Customer** | `/customer` | Map-based discovery, search/filter, verified badges, UPI deep-link payments, 1–5★ reviews |
| 🏛️ **Municipal Admin** | `/admin` | KYC approval queue, draw vending/no-vending zones on a map, broadcast push/SMS |

## Tech Stack

- **Next.js 14** (App Router) + TypeScript — frontend UI *and* backend API routes
- **Tailwind CSS** — high-contrast outdoor palette, 48px+ touch targets
- **Prisma** + SQLite (swap to PostgreSQL for prod) — all models in `prisma/schema.prisma`
- **Leaflet / react-leaflet** — maps with OpenStreetMap tiles (no API key)
- **qrcode** — vendor Digital ID QR generation
- **UPI deep links** (`upi://`, `gpay://`, `phonepe://`, `paytmmp://`) per NPCI spec

## Quickstart

```bash
npm install
npx prisma db push     # create SQLite schema
npm run db:seed        # demo vendors, zones, admin, customer
npm run dev            # http://localhost:3000
```

**Demo OTP:** in development mode the OTP is always `123456` (also shown on screen).
Seeded logins: vendor `9876543210`, admin `9900011122`, customer `9600012345` (prefix +91).

## Folder Structure

```
prisma/
  schema.prisma            # Vendor, Customer, Admin, Document, Review,
                           # Favorite, VendingZone, Broadcast, OtpSession
  seed.js                  # demo data
src/
  app/
    page.tsx               # landing: choose your portal
    vendor/                # login → dashboard (QR, duty toggle, KYC uploads)
    customer/              # map/list home, vendor detail (UPI pay, reviews), login
    admin/                 # approvals table, zone editor, broadcast panel
    api/
      auth/otp, auth/verify            # phone+OTP → bearer token
      vendors                          # GET discovery (lat/lng/radius/category/q)
                                       # POST registration
      vendors/me, me/status, me/documents
      vendors/[phone], [phone]/reviews # public card + ratings
      customers/me/favorites           # save/unsave vendors
      upload                           # KYC file upload (multipart)
      admin/vendors, vendors/[phone]   # KYC queue + approve/reject
      admin/zones, zones/[id]          # polygon demarcation CRUD
      admin/broadcast                  # audience-targeted push/SMS
  components/
    OtpLogin.tsx, LanguageToggle.tsx, LanguageProvider.tsx
    vendor/    VendorRegistration, DutyStatusToggle, DigitalIdCard, DocumentUpload
    customer/  MapView, SearchFilterBar, VendorCard, VerifiedBadge,
               StarRating, UPIPayButton, ReviewSection
    admin/     AdminNav, PendingVendorsTable, ZoneEditor, BroadcastPanel
  lib/
    prisma.ts, auth.ts (OTP + HMAC bearer tokens), api-client.ts,
    upi.ts, geo.ts (haversine, point-in-polygon), categories.ts
public/
  manifest.webmanifest     # PWA install for vendors
```

## Key Behaviors

- **Duty Status ON** → vendor appears in customer discovery; GPS re-pings every 2 min; going ON inside a red **No-Vending Zone** is rejected (403) by point-in-polygon check.
- **QR Digital ID** (`SVY-XXXXXXXX`) encodes the public profile URL — scan → card → pay.
- **Approve** requires at least one Aadhaar document; decision updates all KYC docs and (stub) notifies the vendor.
- **Broadcasts** resolve audience (`ALL_VENDORS` / `ZONE:<id>` / `CATEGORY:<cat>`) to recipients; delivery is a console stub.
- **Language toggle** ships with a `LanguageProvider` context (en/hi/kn/mr/ta/bn) — wire in next-intl or react-i18next for real translations.

## Production Hardening TODOs

1. Replace OTP console stub with an SMS gateway (MSG91 / Gupshup / Twilio India).
2. Move session token from `localStorage` to httpOnly cookies (iron-session / NextAuth).
3. Swap local file uploads for S3/MinIO + virus scanning + Aadhaar number masking.
4. Switch Prisma datasource to PostgreSQL; add rate limiting on `/api/auth/otp`.
5. Wire FCM push notifications alongside SMS in the broadcast fan-out.
6. Add real i18n dictionaries and text-to-speech for low-literacy users.
