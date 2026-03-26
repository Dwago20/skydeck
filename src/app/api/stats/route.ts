import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const providers = await prisma.cloudProvider.count({
      where: { status: "connected" },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ providers: 0 }, { status: 500 });
  }
}
