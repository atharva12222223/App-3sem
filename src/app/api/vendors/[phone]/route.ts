import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vendors/[phone] — public vendor card (no PII beyond public fields)
export async function GET(
  _req: NextRequest,
  { params }: { params: { phone: string } }
) {
  const vendor = await prisma.vendor.findUnique({
    where: { phone: params.phone },
    select: {
      phone: true,
      name: true,
      nameVernacular: true,
      category: true,
      verificationStatus: true,
      upiId: true,
      lat: true,
      lng: true,
      rating: true,
      ratingCount: true,
      dutyActive: true,
      lastPingAt: true,
      zone: { select: { name: true } },
    },
  });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }
  return NextResponse.json({ vendor });
}
