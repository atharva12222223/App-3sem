import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// GET /api/admin/broadcast — history
export async function GET(req: NextRequest) {
  const session = authFromRequest(req, "ADMIN");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const broadcasts = await prisma.broadcast.findMany({
    include: { sentBy: { select: { name: true, department: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ broadcasts });
}

// POST /api/admin/broadcast
// Body: { title, message, audience?: ALL_VENDORS|ZONE:<id>|CATEGORY:<cat>,
//         channel?: PUSH|SMS|PUSH_SMS }
export async function POST(req: NextRequest) {
  const session = authFromRequest(req, "ADMIN");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, message, audience = "ALL_VENDORS", channel = "PUSH_SMS" } =
    await req.json();
  if (!title || !message) {
    return NextResponse.json({ error: "title and message required" }, { status: 400 });
  }
  if (!["PUSH", "SMS", "PUSH_SMS"].includes(channel)) {
    return NextResponse.json({ error: "invalid channel" }, { status: 400 });
  }

  // Resolve audience → recipient list
  const where =
    audience.startsWith("ZONE:")
      ? { zoneId: audience.slice(5), verificationStatus: "APPROVED" }
      : audience.startsWith("CATEGORY:")
        ? { category: audience.slice(9), verificationStatus: "APPROVED" }
        : { verificationStatus: "APPROVED" };
  const recipients = await prisma.vendor.findMany({
    where,
    select: { phone: true, name: true },
  });

  const admin = await prisma.admin.findUnique({ where: { phone: session.phone } });
  const broadcast = await prisma.broadcast.create({
    data: {
      title,
      message,
      audience,
      channel,
      status: "SENT",
      sentAt: new Date(),
      sentById: admin?.id,
    },
  });

  // STUB: fan out to FCM (push) + SMS gateway. Logged here for the demo.
  console.log(
    `[BROADCAST ${broadcast.id}] "${title}" → ${recipients.length} vendors via ${channel}`
  );

  return NextResponse.json({ broadcast, recipientCount: recipients.length }, { status: 201 });
}
