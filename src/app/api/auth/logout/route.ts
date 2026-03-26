import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getTokenFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromCookies(req.headers.get("cookie"));

    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("skydeck_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
