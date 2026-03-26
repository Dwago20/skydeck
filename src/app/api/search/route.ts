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
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], query: q });
  }

  try {
    const [instances, buckets, files, vpcs] = await Promise.all([
      prisma.instance.findMany({
        where: { name: { contains: q } },
        include: { provider: true },
        take: 5,
      }),
      prisma.bucket.findMany({
        where: { name: { contains: q } },
        include: { provider: true },
        take: 5,
      }),
      prisma.storageFile.findMany({
        where: { key: { contains: q } },
        include: { bucket: true, provider: true },
        take: 5,
      }),
      prisma.vpc.findMany({
        where: { name: { contains: q } },
        take: 5,
      }),
    ]);

    return NextResponse.json(
      serializeBigInt({
        results: {
          instances: instances.map((i) => ({
            id: i.id,
            name: i.name,
            type: "instance" as const,
            detail: `${i.provider.label} · ${i.type} · ${i.status}`,
            href: "/compute",
          })),
          buckets: buckets.map((b) => ({
            id: b.id,
            name: b.name,
            type: "bucket" as const,
            detail: `${b.provider.label} · ${b.region}`,
            href: "/storage",
          })),
          files: files.map((f) => ({
            id: f.id,
            name: f.key.split("/").pop() || f.key,
            type: "file" as const,
            detail: `${f.bucket.name} · ${f.provider.label}`,
            href: "/storage",
          })),
          vpcs: vpcs.map((v) => ({
            id: v.id,
            name: v.name,
            type: "vpc" as const,
            detail: `${v.provider} · ${v.cidr}`,
            href: "/network",
          })),
        },
        query: q,
      })
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
