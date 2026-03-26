import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }
  return obj;
}

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  const type = req.nextUrl.searchParams.get("type");

  try {
    if (type === "instances") {
      const instances = await prisma.instance.findMany({
        where: provider ? { provider: { name: provider } } : undefined,
        include: { provider: true },
        orderBy: { launchTime: "desc" },
      });
      return NextResponse.json(serializeBigInt({ instances }));
    }

    if (type === "buckets") {
      const buckets = await prisma.bucket.findMany({
        where: provider ? { provider: { name: provider } } : undefined,
        include: { provider: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(serializeBigInt({ buckets }));
    }

    const [instances, buckets, files, providers] = await Promise.all([
      prisma.instance.findMany({ include: { provider: true }, orderBy: { launchTime: "desc" } }),
      prisma.bucket.findMany({ include: { provider: true }, orderBy: { createdAt: "desc" } }),
      prisma.storageFile.findMany({ include: { provider: true, bucket: true }, orderBy: { lastModified: "desc" } }),
      prisma.cloudProvider.findMany(),
    ]);

    return NextResponse.json(serializeBigInt({ instances, buckets, files, providers }));
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
