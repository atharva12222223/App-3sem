import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// GET /api/admin/me — admin profile for the dashboard header
export async function GET(req: NextRequest) {
  const session = authFromRequest(req, "ADMIN");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.admin.findUnique({ where: { phone: session.phone } });
  if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  return NextResponse.json({ admin });
}
