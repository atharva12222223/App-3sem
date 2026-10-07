import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";
import { haversineKm } from "@/lib/geo";

// GET /api/vendors?lat=&lng=&radiusKm=&category=&q=&dutyOnly=true
// Public discovery: returns APPROVED vendors, optionally ranked by distance.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = parseFloat(sp.get("lat") ?? "NaN");
  const lng = parseFloat(sp.get("lng") ?? "NaN");
  const radiusKm = parseFloat(sp.get("radiusKm") ?? "5");
  const category = sp.get("category");
  const q = sp.get("q")?.trim();
  const dutyOnly = sp.get("dutyOnly") !== "false";

  const vendors = await prisma.vendor.findMany({
    where: {
      verificationStatus: "APPROVED",
      ...(dutyOnly ? { dutyActive: true } : {}),
      ...(category && category !== "ALL" ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { nameVernacular: { contains: q } },
              { category: { contains: q.toUpperCase() } },
            ],
          }
        : {}),
    },
    include: { zone: { select: { name: true, type: true } } },
  });

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  let results = vendors
    .filter((v) => !hasCoords || (v.lat != null && v.lng != null))
    .map((v) => ({
      ...v,
      distanceKm:
        hasCoords && v.lat != null && v.lng != null
          ? haversineKm(lat, lng, v.lat, v.lng)
          : null,
    }))
    .sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));

  const nearby = results.filter((v) => !hasCoords || v.distanceKm == null || v.distanceKm <= radiusKm);
  const finalResults = nearby.length > 0 ? nearby : results;

  return NextResponse.json({ count: finalResults.length, vendors: finalResults });
}

// POST /api/vendors — register a new vendor profile (requires VENDOR token)
export async function POST(req: NextRequest) {
  const session = authFromRequest(req, "VENDOR");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, nameVernacular, category, upiId, lat, lng, zoneId } = body;
  if (!name || !category) {
    return NextResponse.json({ error: "name and category are required" }, { status: 400 });
  }

  const vendor = await prisma.vendor.upsert({
    where: { phone: session.phone },
    update: { name, nameVernacular, category, upiId, lat, lng, zoneId },
    create: {
      phone: session.phone,
      name,
      nameVernacular,
      category,
      upiId,
      lat,
      lng,
      zoneId,
      verificationStatus: "PENDING",
    },
  });
  return NextResponse.json({ vendor }, { status: 201 });
}
