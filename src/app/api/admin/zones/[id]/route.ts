import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// DELETE /api/admin/zones/[id] — remove a demarcated zone (ADMIN token)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = authFromRequest(req, "ADMIN");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const zone = await prisma.vendingZone.findUnique({ where: { id: params.id } });
  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

  // Unlink vendors before deleting the zone
  await prisma.$transaction([
    prisma.vendor.updateMany({
      where: { zoneId: params.id },
      data: { zoneId: null },
    }),
    prisma.vendingZone.delete({ where: { id: params.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
