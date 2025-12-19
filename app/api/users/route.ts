import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, type AuthenticatedRequest } from "@/lib/api-middleware"

// GET all users (for assignment dropdowns)
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const users = await sql`
      SELECT id, email, full_name, role
      FROM users
      ORDER BY full_name
    `

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[v0] Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
