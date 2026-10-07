import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";
import { pointInPolygon } from "@/lib/geo";

// POST /api/vendors/me/status
// Body: { dutyActive: boolean, lat?: number, lng?: number }
// Toggles live-location sharing ("Duty Status"). When turning ON with
// coordinates, validates the vendor is not inside a NO_VENDING zone.
export async function POST(req: NextRequest) {
  const session = authFromRequest(req, "VENDOR");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dutyActive, lat, lng } = await req.json();
  if (typeof dutyActive !== "boolean") {
    return NextResponse.json({ error: "dutyActive (boolean) required" }, { status: 400 });
  }

  if (dutyActive && Number.isFinite(lat) && Number.isFinite(lng)) {
    const noVendingZones = await prisma.vendingZone.findMany({
      where: { type: "NO_VENDING" },
    });
    for (const zone of noVendingZones) {
      const polygon = JSON.parse(zone.polygon) as [number, number][];
      if (pointInPolygon([lat, lng], polygon)) {
        return NextResponse.json(
          { error: `You are inside a No-Vending Zone: ${zone.name}. Vending is not permitted here.` },
          { status: 403 }
        );
      }
    }
  }

  const vendor = await prisma.vendor.update({
    where: { phone: session.phone },
    data: {
      dutyActive,
      ...(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
      ...(dutyActive ? { lastPingAt: new Date() } : {}),
    },
    select: { phone: true, dutyActive: true, lat: true, lng: true, lastPingAt: true },
  });
  return NextResponse.json({ vendor });
}
