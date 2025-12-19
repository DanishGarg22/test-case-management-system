import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"
import { cache, CACHE_DURATION } from "@/lib/redis"

// GET test suites
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Check cache
    const cacheKey = `testsuites:${projectId}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json({ testSuites: cached, fromCache: true })
    }

    const testSuites = await sql`
      SELECT 
        ts.*,
        u.full_name as created_by_name,
        (SELECT COUNT(*) FROM test_suite_cases WHERE test_suite_id = ts.id) as test_case_count
      FROM test_suites ts
      LEFT JOIN users u ON ts.created_by = u.id
      WHERE ts.project_id = ${projectId}
      ORDER BY ts.created_at DESC
    `

    // Cache results
    await cache.set(cacheKey, testSuites, CACHE_DURATION.TEST_SUITES)

    return NextResponse.json({ testSuites })
  } catch (error) {
    console.error("[v0] Get test suites error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

// POST create test suite (admin and test-lead only)
export const POST = requireRole(["admin", "test-lead"])(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const body = await request.json()
    const { project_id, name, description } = body

    if (!project_id || !name) {
      return NextResponse.json({ error: "Project ID and name are required" }, { status: 400 })
    }

    const sanitizedName = name.trim().replace(/[<>]/g, "")
    const sanitizedDescription = description?.trim().replace(/[<>]/g, "") || null

    const result = await sql`
      INSERT INTO test_suites (project_id, name, description, created_by)
      VALUES (${project_id}, ${sanitizedName}, ${sanitizedDescription}, ${user.id})
      RETURNING *
    `

    // Invalidate cache
    await cache.delPattern("testsuites:*")

    return NextResponse.json({ testSuite: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create test suite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
