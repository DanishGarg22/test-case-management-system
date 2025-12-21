// app/api/auth/logout/route.ts

export const runtime = "nodejs"; // 🔥 REQUIRED

import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ message: "Logged out" });
  } catch (error) {
    console.error("[LOGOUT ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}