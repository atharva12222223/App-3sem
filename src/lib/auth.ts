// Minimal OTP + session helpers. In production, replace the OTP delivery
// stub with a real SMS gateway (MSG91 / Twilio India / Gupshup) and the
// session token with a signed JWT or iron-session cookie.
import crypto from "crypto";
import { prisma } from "./prisma";

const OTP_TTL_MINUTES = 5;

export function generateOtp(): string {
  // Demo mode returns a fixed code so the flow is testable without SMS.
  if (process.env.NODE_ENV !== "production") return "123456";
  return crypto.randomInt(100000, 999999).toString();
}

export async function createOtpSession(phone: string, role: string) {
  const code = generateOtp();
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
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
  // STUB: real SMS gateway call goes here.
  console.log(`[OTP] code for ${phone}: ${code}`);
  return { sent: true, devCode: process.env.NODE_ENV !== "production" ? code : undefined };
}

export async function verifyOtp(phone: string, code: string, role: string) {
  const session = await prisma.otpSession.findUnique({ where: { phone } });
  if (!session || session.role !== role) return false;
  if (session.expiresAt < new Date()) return false;
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  if (hash !== session.codeHash) return false;
  await prisma.otpSession.delete({ where: { phone } });
  return true;
}

// Opaque bearer token = base64(role:phone:hmac). Verified on each request.
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
