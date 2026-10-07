import { NextRequest, NextResponse } from "next/server";
import { createOtpSession } from "@/lib/auth";

const PHONE_RE = /^9[0-9]{9,12}$/; // Indian numbers: 9xxxxxxxxxx with country code

// POST /api/auth/otp — request an OTP for phone login
export async function POST(req: NextRequest) {
  const { phone, role } = await req.json();
  if (typeof phone !== "string" || !PHONE_RE.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid Indian phone number with country code (e.g. 919876543210)" },
      { status: 400 }
    );
  }
  if (!["VENDOR", "CUSTOMER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const result = await createOtpSession(phone, role);
  return NextResponse.json(result);
}
