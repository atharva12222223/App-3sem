// Minimal OTP + session helpers.
// SMS delivery via Fast2SMS (https://fast2sms.com) — set FAST2SMS_API_KEY in env.
// Falls back to demo mode (logs OTP to console, returns devCode) when key is absent.
import crypto from "crypto";
import { prisma } from "./prisma";

const OTP_TTL_MINUTES = 10; // OTP valid for 10 minutes

// ─────────────────────────── OTP Generation ────────────────────────────────

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// ─────────────────────────── SMS via Fast2SMS ──────────────────────────────

/**
 * Sends an OTP SMS using Fast2SMS DLT/Quick SMS API.
 * Docs: https://docs.fast2sms.com
 *
 * Returns true on success, throws on failure.
 */
async function sendSmsViaFast2Sms(phone: string, otp: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY not configured");

  // Strip country code for Fast2SMS — it expects 10-digit Indian numbers
  const mobileNumber = phone.startsWith("91") ? phone.slice(2) : phone;

  // Quick SMS (non-DLT) — works on free tier for testing
  // For production/DLT template-based SMS, use the DLT route instead
  const url = "https://www.fast2sms.com/dev/bulkV2";

  const body = new URLSearchParams({
    route: "otp",          // OTP route (DLT-approved for all operators)
    variables_values: otp, // The OTP digits
    numbers: mobileNumber,
    flash: "0",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.return === false) {
    const msg = data.message?.[0] ?? data.message ?? "Fast2SMS API error";
    console.error("[Fast2SMS] Error:", data);
    throw new Error(`SMS failed: ${msg}`);
  }
  console.log(`[Fast2SMS] OTP sent to ${mobileNumber}`, data);
}

// ─────────────────────────── Public helpers ────────────────────────────────

export async function createOtpSession(phone: string, role: string) {
  const code = generateOtp();
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  // Upsert OTP session in DB
  await prisma.otpSession.upsert({
    where: { phone },
    update: {
      codeHash,
      role,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
    create: {
      phone,
      codeHash,
      role,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  const hasGateway = !!process.env.FAST2SMS_API_KEY;

  if (hasGateway) {
    // Real SMS — throws if delivery fails so the caller can surface the error
    await sendSmsViaFast2Sms(phone, code);
    console.log(`[OTP] Real SMS sent to ${phone}`);
    return { sent: true };
  } else {
    // Demo / local dev fallback — log OTP and return it to the UI
    console.log(`[OTP-DEMO] code for ${phone}: ${code}`);
    return { sent: true, devCode: code };
  }
}

export async function verifyOtp(phone: string, code: string, role: string) {
  const session = await prisma.otpSession.findUnique({ where: { phone } });
  if (!session || session.role !== role) return false;
  if (session.expiresAt < new Date()) return false;

  const hash = crypto.createHash("sha256").update(code).digest("hex");
  const validCode = hash === session.codeHash;

  if (!validCode) return false;

  // Delete the OTP session so it can't be reused
  await prisma.otpSession.delete({ where: { phone } }).catch(() => {});
  return true;
}

// ─────────────────────────── Token helpers ─────────────────────────────────

// Opaque bearer token = base64url(role:phone:hmac). Verified on each request.
export function issueToken(phone: string, role: string): string {
  const payload = `${role}:${phone}`;
  const sig = crypto
    .createHmac("sha256", process.env.AUTH_SECRET ?? "dev-only-secret-change-me")
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function parseToken(token: string | null): { phone: string; role: string } | null {
  if (!token) return null;
  try {
    const [role, phone, sig] = Buffer.from(token, "base64url").toString().split(":");
    const expected = crypto
      .createHmac("sha256", process.env.AUTH_SECRET ?? "dev-only-secret-change-me")
      .update(`${role}:${phone}`)
      .digest("hex");
    if (!role || !phone || sig !== expected) return null;
    return { phone, role };
  } catch {
    return null;
  }
}

export function authFromRequest(req: Request, requiredRole?: string) {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const session = parseToken(token);
  if (!session) return null;
  if (requiredRole && session.role !== requiredRole) return null;
  return session;
}
