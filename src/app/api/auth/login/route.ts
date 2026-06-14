import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, getSessionDuration } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const adminPass = process.env.ADMIN_PASSWORD || "password123";

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json(
        { success: false, error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(username);
    const response = NextResponse.json({ success: true });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getSessionDuration(),
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Login gagal" },
      { status: 500 }
    );
  }
}
