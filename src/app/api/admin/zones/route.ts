import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// GET /api/admin/zones — all vending / no-vending zones (public read so the
// customer + vendor maps can render them too)
export async function GET() {
  const zones = await prisma.vendingZone.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ zones });
}

// POST /api/admin/zones — create a zone (ADMIN token)
// Body: { name, type: VENDING|NO_VENDING, region, polygon: [[lat,lng],...] }
export async function POST(req: NextRequest) {
  const session = authFromRequest(req, "ADMIN");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, region, polygon } = await req.json();
  if (!name || !["VENDING", "NO_VENDING"].includes(type) || !region) {
    return NextResponse.json(
      { error: "name, region and type (VENDING|NO_VENDING) required" },
      { status: 400 }
    );
  }
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return NextResponse.json(
      { error: "polygon must be an array of at least 3 [lat,lng] points" },
      { status: 400 }
    );
  }

  const admin = await prisma.admin.findUnique({ where: { phone: session.phone } });
  const zone = await prisma.vendingZone.create({
    data: {
      name,
      type,
      region,
      polygon: JSON.stringify(polygon),
      createdById: admin?.id,
    },
  });
  return NextResponse.json({ zone }, { status: 201 });
}
