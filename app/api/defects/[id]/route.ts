import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"

// PUT update defect
export const PUT = requireRole(["admin", "test-lead", "tester"])(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { title, description, severity, status, assigned_to } = body

      const sanitizedTitle = title?.trim().replace(/[<>]/g, "")
      const sanitizedDescription = description?.trim().replace(/[<>]/g, "")

      const result = await sql`
      UPDATE defects
      SET 
        title = COALESCE(${sanitizedTitle}, title),
        description = COALESCE(${sanitizedDescription}, description),
        severity = COALESCE(${severity}, severity),
        status = COALESCE(${status}, status),
        assigned_to = COALESCE(${assigned_to}, assigned_to),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

      if (result.length === 0) {
        return NextResponse.json({ error: "Defect not found" }, { status: 404 })
      }

      return NextResponse.json({ defect: result[0] })
    } catch (error) {
      console.error("[v0] Update defect error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)
