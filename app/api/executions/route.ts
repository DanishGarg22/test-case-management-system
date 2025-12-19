import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit"
import { cache } from "@/lib/redis"

// GET test executions
export const GET = requireRole(["admin", "test-lead", "tester"])(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const testCaseId = searchParams.get("test_case_id")
    const projectId = searchParams.get("project_id")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = `
      SELECT 
        te.*,
        u.full_name as executed_by_name,
        tc.title as test_case_title,
        tc.priority as test_case_priority
      FROM test_executions te
      LEFT JOIN users u ON te.executed_by = u.id
      LEFT JOIN test_cases tc ON te.test_case_id = tc.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (testCaseId) {
      query += ` AND te.test_case_id = $${paramIndex}`
      params.push(testCaseId)
      paramIndex++
    }

    if (projectId) {
      query += ` AND tc.project_id = $${paramIndex}`
      params.push(projectId)
      paramIndex++
    }

    if (status) {
      query += ` AND te.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY te.executed_at DESC LIMIT $${paramIndex}`
    params.push(limit)

    const executions = await sql(query, params)

    return NextResponse.json({ executions })
  } catch (error) {
    console.error("[v0] Get executions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

// POST create test execution (admin, test-lead, tester only)
export const POST = requireRole(["admin", "test-lead", "tester"])(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!

    // Rate limiting
    const limitResult = await rateLimit(`executions:create:${user.id}`, rateLimitConfigs.execution)
    if (!limitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const { test_case_id, test_suite_id, status, comments, execution_time } = body

    // Validation
    if (!test_case_id || !status) {
      return NextResponse.json({ error: "Test case ID and status are required" }, { status: 400 })
    }

    const validStatuses = ["Pass", "Fail", "Blocked", "Skipped"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Sanitize comments
    const sanitizedComments = comments?.trim().replace(/[<>]/g, "") || null

    // Create execution
    const result = await sql`
      INSERT INTO test_executions (
        test_case_id, test_suite_id, executed_by, status, comments, execution_time
      )
      VALUES (
        ${test_case_id}, ${test_suite_id}, ${user.id}, ${status}, ${sanitizedComments}, ${execution_time}
      )
      RETURNING *
    `

    const execution = result[0]

    // Invalidate cache
    await cache.delPattern("analytics:*")
    await cache.delPattern("testcases:*")

    return NextResponse.json({ execution }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create execution error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
