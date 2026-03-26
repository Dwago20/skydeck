import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const records = await prisma.costRecord.findMany({
      where: { period: "monthly" },
      orderBy: { provider: "asc" },
    });

    const costs = records.map((r) => ({
      provider: r.provider,
      compute: r.compute,
      storage: r.storage,
      network: r.network,
      other: r.other,
    }));

    return NextResponse.json({ costs });
  } catch (error) {
    console.error("Costs API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
