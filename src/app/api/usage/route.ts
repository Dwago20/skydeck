import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const snapshots = await prisma.usageSnapshot.findMany({
      orderBy: { timestamp: "asc" },
      take: 24,
    });

    const data = snapshots.map((s) => ({
      timestamp: s.timestamp.toISOString().slice(11, 16), // "HH:MM"
      cpu: Math.round(s.cpu * 10) / 10,
      memory: Math.round(s.memory * 10) / 10,
      network: Math.round(s.network * 10) / 10,
      storage: Math.round(s.storage * 10) / 10,
    }));

    return NextResponse.json({ usage: data });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
