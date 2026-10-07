import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authFromRequest } from "@/lib/auth";

const DOC_TYPES = ["AADHAAR", "FSSAI", "MUNICIPAL_CERT"];

// POST /api/vendors/me/documents
// Body: { type: AADHAAR|FSSAI|MUNICIPAL_CERT, fileUrl: string }
// The file itself is uploaded via POST /api/upload which returns the URL.
export async function POST(req: NextRequest) {
  const session = authFromRequest(req, "VENDOR");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, fileUrl } = await req.json();
  if (!DOC_TYPES.includes(type) || !fileUrl) {
    return NextResponse.json(
      { error: `type must be one of ${DOC_TYPES.join(", ")} and fileUrl is required` },
      { status: 400 }
    );
  }

  const doc = await prisma.document.upsert({
    where: { vendorPhone_type: { vendorPhone: session.phone, type } },
    update: { fileUrl, status: "PENDING" },
    create: { vendorPhone: session.phone, type, fileUrl, status: "PENDING" },
  });
  return NextResponse.json({ document: doc }, { status: 201 });
}

// GET /api/vendors/me/documents
export async function GET(req: NextRequest) {
  const session = authFromRequest(req, "VENDOR");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const documents = await prisma.document.findMany({
    where: { vendorPhone: session.phone },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json({ documents });
}
