import { NextRequest, NextResponse } from "next/server";
import { authFromRequest } from "@/lib/auth";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_SIZE_MB = 5;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

// POST /api/upload — multipart form upload for KYC documents.
// Boilerplate saves to ./public/uploads; swap for S3/MinIO + AV scanning
// (e.g. ClamAV) and Aadhaar masking in production.
export async function POST(req: NextRequest) {
  const session = authFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG or PDF allowed" },
      { status: 415 }
    );
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_SIZE_MB} MB)` },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${session.phone}-${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", session.role.toLowerCase());
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    fileUrl: `/uploads/${session.role.toLowerCase()}/${safeName}`,
  });
}
