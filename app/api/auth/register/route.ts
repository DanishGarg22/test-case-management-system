// app/api/auth/register/route.ts

export const runtime = "nodejs"; // 🔥 REQUIRED

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role = "tester" } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedFullName = fullName.trim().replace(/[<>]/g, "");

    const validRoles = ["admin", "test-lead", "tester", "read-only"];
    const sanitizedRole = validRoles.includes(role) ? role : "tester";

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${sanitizedEmail}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (${sanitizedEmail}, ${passwordHash}, ${sanitizedFullName}, ${sanitizedRole})
      RETURNING id, email, full_name, role
    `;

    const user = result[0];

    const token = await createToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
