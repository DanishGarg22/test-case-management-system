import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit"
import { cache, CACHE_DURATION } from "@/lib/redis"

// GET test cases with filtering and pagination
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const { searchParams } = new URL(request.url)

    const projectId = searchParams.get("project_id")
    const priority = searchParams.get("priority")
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const assignedTo = searchParams.get("assigned_to")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    // Rate limiting
    const limitResult = await rateLimit(`testcases:get:${user.id}`, rateLimitConfigs.testcase)
    if (!limitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // Build cache key
    const cacheKey = `testcases:${projectId}:${priority}:${type}:${search}:${assignedTo}:${page}:${limit}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json({ testCases: cached, fromCache: true })
    }

    // Build dynamic query
    let query = `
      SELECT 
        tc.*,
        u1.full_name as created_by_name,
        u2.full_name as assigned_to_name,
        (SELECT COUNT(*) FROM test_steps WHERE test_case_id = tc.id) as steps_count
      FROM test_cases tc
      LEFT JOIN users u1 ON tc.created_by = u1.id
      LEFT JOIN users u2 ON tc.assigned_to = u2.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (projectId) {
      query += ` AND tc.project_id = $${paramIndex}`
      params.push(projectId)
      paramIndex++
    }

    if (priority) {
      query += ` AND tc.priority = $${paramIndex}`
      params.push(priority)
      paramIndex++
    }

    if (type) {
      query += ` AND tc.type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    if (search) {
      query += ` AND (tc.title ILIKE $${paramIndex} OR tc.description ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (assignedTo) {
      query += ` AND tc.assigned_to = $${paramIndex}`
      params.push(assignedTo)
      paramIndex++
    }

    query += ` ORDER BY tc.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const testCases = await sql(query, params)

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM test_cases tc WHERE 1=1`
    const countParams: any[] = []
    let countParamIndex = 1

    if (projectId) {
      countQuery += ` AND tc.project_id = $${countParamIndex}`
      countParams.push(projectId)
      countParamIndex++
    }

    if (priority) {
      countQuery += ` AND tc.priority = $${countParamIndex}`
      countParams.push(priority)
      countParamIndex++
    }

    if (type) {
      countQuery += ` AND tc.type = $${countParamIndex}`
      countParams.push(type)
      countParamIndex++
    }

    if (search) {
      countQuery += ` AND (tc.title ILIKE $${countParamIndex} OR tc.description ILIKE $${countParamIndex})`
      countParams.push(`%${search}%`)
      countParamIndex++
    }

    if (assignedTo) {
      countQuery += ` AND tc.assigned_to = $${countParamIndex}`
      countParams.push(assignedTo)
      countParamIndex++
    }

    const countResult = await sql(countQuery, countParams)
    const total = Number.parseInt(countResult[0].total as string)

    const result = {
      testCases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    // Cache results
    await cache.set(cacheKey, result, CACHE_DURATION.TEST_CASES)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Get test cases error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

// POST create test case (admin and test-lead only)
export const POST = requireRole(["admin", "test-lead"])(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const body = await request.json()
    const {
      project_id,
      title,
      description,
      priority = "Medium",
      type = "Functional",
      pre_conditions,
      post_conditions,
      tags = [],
      assigned_to,
      steps = [],
    } = body

    // Validation
    if (!project_id || !title) {
      return NextResponse.json({ error: "Project ID and title are required" }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedTitle = title.trim().replace(/[<>]/g, "")
    const sanitizedDescription = description?.trim().replace(/[<>]/g, "") || null

    // Create test case
    const result = await sql`
      INSERT INTO test_cases (
        project_id, title, description, priority, type,
        pre_conditions, post_conditions, tags, created_by, assigned_to
      )
      VALUES (
        ${project_id}, ${sanitizedTitle}, ${sanitizedDescription}, ${priority}, ${type},
        ${pre_conditions}, ${post_conditions}, ${tags}, ${user.id}, ${assigned_to}
      )
      RETURNING *
    `

    const testCase = result[0]

    // Create test steps
    if (steps && steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        await sql`
          INSERT INTO test_steps (test_case_id, step_number, description, expected_result)
          VALUES (${testCase.id}, ${i + 1}, ${step.description}, ${step.expected_result})
        `
      }
    }

    // Invalidate cache
    await cache.delPattern("testcases:*")

    return NextResponse.json({ testCase }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create test case error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
