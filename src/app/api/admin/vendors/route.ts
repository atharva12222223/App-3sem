import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// GET /api/admin/vendors?status=PENDING — registration queue with documents
export async function GET(req: NextRequest) {
  const session = authFromRequest(req, "ADMIN");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "PENDING";
  const vendors = await prisma.vendor.findMany({
    where: { verificationStatus: status },
    include: { documents: true, zone: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ count: vendors.length, vendors });
}
