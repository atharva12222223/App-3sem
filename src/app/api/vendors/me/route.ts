import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// GET /api/vendors/me — own profile incl. documents & verification state
export async function GET(req: NextRequest) {
  const session = authFromRequest(req, "VENDOR");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({
    where: { phone: session.phone },
    include: { documents: true, zone: true },
  });
  return NextResponse.json({ vendor });
}

// PATCH /api/vendors/me — update own editable fields
export async function PATCH(req: NextRequest) {
  const session = authFromRequest(req, "VENDOR");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  for (const key of ["name", "nameVernacular", "category", "upiId", "zoneId"]) {
    if (key in body) allowed[key] = body[key];
  }

  const vendor = await prisma.vendor.update({
    where: { phone: session.phone },
    data: allowed,
  });
  return NextResponse.json({ vendor });
}
