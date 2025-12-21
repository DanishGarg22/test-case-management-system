// app/api/auth/login/route.ts

export const runtime = "nodejs"; // 🔥 REQUIRED

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const users = await sql`
      SELECT id, email, password_hash, full_name, role
      FROM users
      WHERE email = ${sanitizedEmail}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = users[0];

    const isValidPassword = await verifyPassword(
      password,
      user.password_hash as string
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: user.id as number,
      email: user.email as string,
      full_name: user.full_name as string,
      role: user.role as "admin" | "test-lead" | "tester" | "read-only",
    });

    await setAuthCookie(token);

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[LOGIN ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
