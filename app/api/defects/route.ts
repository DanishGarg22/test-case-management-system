import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"

// GET defects
export const GET = requireRole(["admin", "test-lead", "tester"])(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")
    const status = searchParams.get("status")

    let query = `
      SELECT 
        d.*,
        tc.title as test_case_title,
        tc.project_id,
        u1.full_name as created_by_name,
        u2.full_name as assigned_to_name
      FROM defects d
      LEFT JOIN test_cases tc ON d.test_case_id = tc.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.assigned_to = u2.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (projectId) {
      query += ` AND tc.project_id = $${paramIndex}`
      params.push(projectId)
      paramIndex++
    }

    if (status) {
      query += ` AND d.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY d.created_at DESC`

    const defects = await sql(query, params)

    return NextResponse.json({ defects })
  } catch (error) {
    console.error("[v0] Get defects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

// POST create defect
export const POST = requireRole(["admin", "test-lead", "tester"])(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const body = await request.json()
    const { test_execution_id, test_case_id, title, description, severity = "Medium", assigned_to } = body

    // Validation
    if (!test_case_id || !title) {
      return NextResponse.json({ error: "Test case ID and title are required" }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedTitle = title.trim().replace(/[<>]/g, "")
    const sanitizedDescription = description?.trim().replace(/[<>]/g, "") || null

    // Create defect
    const result = await sql`
      INSERT INTO defects (
        test_execution_id, test_case_id, title, description, severity, created_by, assigned_to
      )
      VALUES (
        ${test_execution_id}, ${test_case_id}, ${sanitizedTitle}, ${sanitizedDescription}, 
        ${severity}, ${user.id}, ${assigned_to}
      )
      RETURNING *
    `

    return NextResponse.json({ defect: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create defect error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
