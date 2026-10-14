import { NextRequest, NextResponse } from "next/server";
import { createOtpSession } from "@/lib/auth";

// Indian phone: 91 + 10 digits = 12 digits total
const PHONE_RE = /^91[6-9][0-9]{9}$/;

// POST /api/auth/otp — request an OTP for phone login
export async function POST(req: NextRequest) {
  const { phone, role } = await req.json();

  if (typeof phone !== "string" || !PHONE_RE.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number" },
      { status: 400 }
    );
  }
  if (!["VENDOR", "CUSTOMER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const result = await createOtpSession(phone, role);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    console.error("[/api/auth/otp] SMS error:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
