import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"
import { cache } from "@/lib/redis"

// POST bulk operations on test cases (admin and test-lead only)
export const POST = requireRole(["admin", "test-lead"])(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    const { operation, test_case_ids, data } = body

    if (!operation || !test_case_ids || !Array.isArray(test_case_ids)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    switch (operation) {
      case "delete":
        await sql`DELETE FROM test_cases WHERE id = ANY(${test_case_ids})`
        break

      case "update_priority":
        if (!data?.priority) {
          return NextResponse.json({ error: "Priority is required" }, { status: 400 })
        }
        await sql`
          UPDATE test_cases 
          SET priority = ${data.priority}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY(${test_case_ids})
        `
        break

      case "update_status":
        if (!data?.status) {
          return NextResponse.json({ error: "Status is required" }, { status: 400 })
        }
        await sql`
          UPDATE test_cases 
          SET status = ${data.status}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY(${test_case_ids})
        `
        break

      case "assign":
        if (!data?.assigned_to) {
          return NextResponse.json({ error: "Assigned user is required" }, { status: 400 })
        }
        await sql`
          UPDATE test_cases 
          SET assigned_to = ${data.assigned_to}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY(${test_case_ids})
        `
        break

      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
    }

    // Invalidate cache
    await cache.delPattern("testcases:*")

    return NextResponse.json({ message: `Bulk ${operation} completed successfully` })
  } catch (error) {
    console.error("[v0] Bulk operation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
