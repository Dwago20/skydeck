import { NextRequest, NextResponse } from "next/server";
import { getSession, getTokenFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromCookies(req.headers.get("cookie"));

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await getSession(token);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error("Auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
