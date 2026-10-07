import { NextRequest, NextResponse } from "next/server";
import { issueToken, verifyOtp } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/auth/verify — verify OTP, get bearer token
export async function POST(req: NextRequest) {
  const { phone, code, role } = await req.json();
  const ok = await verifyOtp(phone, code, role);
  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
  }

  // Auto-provision customer accounts on first login.
  if (role === "CUSTOMER") {
    await prisma.customer.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });
  }

  const token = issueToken(phone, role);
  const vendor = role === "VENDOR"
    ? await prisma.vendor.findUnique({ where: { phone } })
    : null;

  return NextResponse.json({ token, role, isNewVendor: role === "VENDOR" && !vendor });
}
