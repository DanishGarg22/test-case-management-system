import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const limitResult = await rateLimit(`auth:register:${ip}`, rateLimitConfigs.auth)

    if (!limitResult.success) {
      return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const { email, password, full_name, role = "tester" } = body

    // Input validation
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Sanitize inputs to prevent XSS
    const sanitizedEmail = email.trim().toLowerCase()
    const sanitizedFullName = full_name.trim().replace(/[<>]/g, "")

    // Validate role
    const validRoles = ["admin", "test-lead", "tester", "read-only"]
    const sanitizedRole = validRoles.includes(role) ? role : "tester"

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${sanitizedEmail}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (${sanitizedEmail}, ${passwordHash}, ${sanitizedFullName}, ${sanitizedRole})
      RETURNING id, email, full_name, role
    `

    const user = result[0]

    // Create JWT token
    const token = await createToken({
      id: user.id as number,
      email: user.email as string,
      full_name: user.full_name as string,
      role: user.role as "admin" | "test-lead" | "tester" | "read-only",
    })

    // Set cookie
    await setAuthCookie(token)

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
