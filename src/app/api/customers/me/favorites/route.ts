import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// GET /api/customers/me/favorites — saved vendors
export async function GET(req: NextRequest) {
  const session = authFromRequest(req, "CUSTOMER");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { customerPhone: session.phone },
    include: {
      vendor: {
        select: {
          phone: true,
          name: true,
          category: true,
          rating: true,
          ratingCount: true,
          dutyActive: true,
          verificationStatus: true,
          lat: true,
          lng: true,
        },
      },
    },
    orderBy: { savedAt: "desc" },
  });
  return NextResponse.json({ favorites });
}

// POST /api/customers/me/favorites — save a vendor { vendorPhone }
export async function POST(req: NextRequest) {
  const session = authFromRequest(req, "CUSTOMER");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vendorPhone } = await req.json();
  if (!vendorPhone) {
    return NextResponse.json({ error: "vendorPhone required" }, { status: 400 });
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      customerPhone_vendorPhone: {
        customerPhone: session.phone,
        vendorPhone,
      },
    },
    update: {},
    create: { customerPhone: session.phone, vendorPhone },
  });
  return NextResponse.json({ favorite }, { status: 201 });
}

// DELETE /api/customers/me/favorites?vendorPhone=... — unsave
export async function DELETE(req: NextRequest) {
  const session = authFromRequest(req, "CUSTOMER");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendorPhone = req.nextUrl.searchParams.get("vendorPhone");
  if (!vendorPhone) {
    return NextResponse.json({ error: "vendorPhone required" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: { customerPhone: session.phone, vendorPhone },
  });
  return NextResponse.json({ ok: true });
}
