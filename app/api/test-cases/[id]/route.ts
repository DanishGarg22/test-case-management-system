import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"
import { cache } from "@/lib/redis"

// GET single test case with steps
export const GET = requireAuth(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params

      const testCases = await sql`
      SELECT 
        tc.*,
        u1.full_name as created_by_name,
        u2.full_name as assigned_to_name,
        p.name as project_name
      FROM test_cases tc
      LEFT JOIN users u1 ON tc.created_by = u1.id
      LEFT JOIN users u2 ON tc.assigned_to = u2.id
      LEFT JOIN projects p ON tc.project_id = p.id
      WHERE tc.id = ${id}
    `

      if (testCases.length === 0) {
        return NextResponse.json({ error: "Test case not found" }, { status: 404 })
      }

      const testCase = testCases[0]

      // Get test steps
      const steps = await sql`
      SELECT * FROM test_steps
      WHERE test_case_id = ${id}
      ORDER BY step_number
    `

      // Get execution history
      const executions = await sql`
      SELECT 
        te.*,
        u.full_name as executed_by_name
      FROM test_executions te
      LEFT JOIN users u ON te.executed_by = u.id
      WHERE te.test_case_id = ${id}
      ORDER BY te.executed_at DESC
      LIMIT 10
    `

      return NextResponse.json({
        testCase: {
          ...testCase,
          steps,
          executions,
        },
      })
    } catch (error) {
      console.error("[v0] Get test case error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)

// PUT update test case (admin and test-lead only)
export const PUT = requireRole(["admin", "test-lead"])(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { title, description, priority, type, pre_conditions, post_conditions, tags, assigned_to, steps } = body

      // Update test case
      const sanitizedTitle = title?.trim().replace(/[<>]/g, "")
      const sanitizedDescription = description?.trim().replace(/[<>]/g, "")

      const result = await sql`
      UPDATE test_cases
      SET 
        title = COALESCE(${sanitizedTitle}, title),
        description = COALESCE(${sanitizedDescription}, description),
        priority = COALESCE(${priority}, priority),
        type = COALESCE(${type}, type),
        pre_conditions = COALESCE(${pre_conditions}, pre_conditions),
        post_conditions = COALESCE(${post_conditions}, post_conditions),
        tags = COALESCE(${tags}, tags),
        assigned_to = COALESCE(${assigned_to}, assigned_to),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

      if (result.length === 0) {
        return NextResponse.json({ error: "Test case not found" }, { status: 404 })
      }

      // Update steps if provided
      if (steps) {
        // Delete existing steps
        await sql`DELETE FROM test_steps WHERE test_case_id = ${id}`

        // Insert new steps
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
          await sql`
          INSERT INTO test_steps (test_case_id, step_number, description, expected_result)
          VALUES (${id}, ${i + 1}, ${step.description}, ${step.expected_result})
        `
        }
      }

      // Invalidate cache
      await cache.delPattern("testcases:*")

      return NextResponse.json({ testCase: result[0] })
    } catch (error) {
      console.error("[v0] Update test case error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)

// DELETE test case (admin and test-lead only)
export const DELETE = requireRole(["admin", "test-lead"])(
  async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params

      await sql`DELETE FROM test_cases WHERE id = ${id}`

      // Invalidate cache
      await cache.delPattern("testcases:*")

      return NextResponse.json({ message: "Test case deleted successfully" })
    } catch (error) {
      console.error("[v0] Delete test case error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  },
)
