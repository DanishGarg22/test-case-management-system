import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"
import { cache } from "@/lib/redis"

// POST add member to project (admin and test-lead only)
export const POST = requireRole(["admin", "test-lead"])(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { user_id } = body

      if (!user_id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 })
      }

      // Check if already a member
      const existing = await sql`
      SELECT * FROM project_members
      WHERE project_id = ${id} AND user_id = ${user_id}
    `

      if (existing.length > 0) {
        return NextResponse.json({ error: "User is already a project member" }, { status: 409 })
      }

      await sql`
      INSERT INTO project_members (project_id, user_id)
      VALUES (${id}, ${user_id})
    `

      // Invalidate cache
      await cache.delPattern("projects:*")

      return NextResponse.json({ message: "Member added successfully" }, { status: 201 })
    } catch (error) {
      console.error("[v0] Add project member error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)

// DELETE remove member from project (admin and test-lead only)
export const DELETE = requireRole(["admin", "test-lead"])(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const { searchParams } = new URL(request.url)
      const userId = searchParams.get("user_id")

      if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 })
      }

      await sql`
      DELETE FROM project_members
      WHERE project_id = ${id} AND user_id = ${userId}
    `

      // Invalidate cache
      await cache.delPattern("projects:*")

      return NextResponse.json({ message: "Member removed successfully" })
    } catch (error) {
      console.error("[v0] Remove project member error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)
