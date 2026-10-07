import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// GET /api/vendors/[phone]/reviews — public review list
export async function GET(
  _req: NextRequest,
  { params }: { params: { phone: string } }
) {
  const reviews = await prisma.review.findMany({
    where: { vendorPhone: params.phone },
    include: { customer: { select: { name: true, phone: false } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ reviews });
}

// POST /api/vendors/[phone]/reviews — rate 1–5 stars (CUSTOMER token)
export async function POST(
  req: NextRequest,
  { params }: { params: { phone: string } }
) {
  const session = authFromRequest(req, "CUSTOMER");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rating, comment } = await req.json();
  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "rating must be an integer 1–5" }, { status: 400 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { phone: params.phone } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.review.upsert({
      where: {
        vendorPhone_customerPhone: {
          vendorPhone: params.phone,
          customerPhone: session.phone,
        },
      },
      update: { rating: stars, comment: comment ?? null },
      create: {
        vendorPhone: params.phone,
        customerPhone: session.phone,
        rating: stars,
        comment: comment ?? null,
      },
    });

    // Recompute the denormalized average
    const agg = await tx.review.aggregate({
      where: { vendorPhone: params.phone },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.vendor.update({
      where: { phone: params.phone },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        ratingCount: agg._count.rating,
      },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
