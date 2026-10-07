import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

// POST /api/admin/vendors/[phone]
// Body: { action: "APPROVE" | "REJECT", reason?: string }
// KYC decision. Approving requires at least one AADHAAR document on file.
export async function POST(
  req: NextRequest,
  { params }: { params: { phone: string } }
) {
  const session = authFromRequest(req, "ADMIN");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, reason } = await req.json();
  if (!["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "action must be APPROVE or REJECT" }, { status: 400 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { phone: params.phone },
    include: { documents: true },
  });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  if (action === "APPROVE") {
    const hasAadhaar = vendor.documents.some((d) => d.type === "AADHAAR");
    if (!hasAadhaar) {
      return NextResponse.json(
        { error: "Cannot approve: Aadhaar document missing" },
        { status: 422 }
      );
    }
  }

  await prisma.$transaction([
    prisma.vendor.update({
      where: { phone: params.phone },
      data: {
        verificationStatus: action === "APPROVE" ? "APPROVED" : "REJECTED",
        rejectionReason: action === "REJECT" ? reason ?? "Documents unclear" : null,
      },
    }),
    prisma.document.updateMany({
      where: { vendorPhone: params.phone },
      data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" },
    }),
  ]);

  // STUB: send SMS/push to vendor informing them of the decision.
  console.log(`[NOTIFY] ${params.phone}: registration ${action}`);

  return NextResponse.json({ ok: true });
}
