import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"
import { cache } from "@/lib/redis"

// GET single project
export const GET = requireAuth(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const user = request.user!

      const projects = await sql`
      SELECT p.*, u.full_name as creator_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ${id}
    `

      if (projects.length === 0) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      const project = projects[0]

      // Check if user has access (admin or member)
      if (user.role !== "admin") {
        const members = await sql`
        SELECT * FROM project_members
        WHERE project_id = ${id} AND user_id = ${user.id}
      `
        if (members.length === 0) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }

      // Get project members
      const members = await sql`
      SELECT pm.*, u.full_name, u.email, u.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ${id}
    `

      return NextResponse.json({ project: { ...project, members } })
    } catch (error) {
      console.error("[v0] Get project error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)

// PUT update project (admin and test-lead only)
export const PUT = requireRole(["admin", "test-lead"])(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { name, description, version, status } = body

      const sanitizedName = name?.trim().replace(/[<>]/g, "")
      const sanitizedDescription = description?.trim().replace(/[<>]/g, "")
      const sanitizedVersion = version?.trim()

      const result = await sql`
      UPDATE projects
      SET 
        name = COALESCE(${sanitizedName}, name),
        description = COALESCE(${sanitizedDescription}, description),
        version = COALESCE(${sanitizedVersion}, version),
        status = COALESCE(${status}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

      if (result.length === 0) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      // Invalidate cache
      await cache.delPattern("projects:*")

      return NextResponse.json({ project: result[0] })
    } catch (error) {
      console.error("[v0] Update project error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)

// DELETE project (admin and test-lead only)
export const DELETE = requireRole(["admin", "test-lead"])(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params

      await sql`DELETE FROM projects WHERE id = ${id}`

      // Invalidate cache
      await cache.delPattern("projects:*")

      return NextResponse.json({ message: "Project deleted successfully" })
    } catch (error) {
      console.error("[v0] Delete project error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)
