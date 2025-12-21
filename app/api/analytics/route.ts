import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, type AuthenticatedRequest } from "@/lib/api-middleware"

export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    console.log("Fetching analytics for project:", projectId)

    // Get test case count
    const testCases = await sql`
      SELECT COUNT(*) as total
      FROM test_cases
      WHERE project_id = ${projectId}
    `

    // Get execution stats
    const executions = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Pass' THEN 1 END) as passed,
        COUNT(CASE WHEN status = 'Fail' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'Blocked' THEN 1 END) as blocked,
        COUNT(CASE WHEN status = 'Skipped' THEN 1 END) as skipped
      FROM test_executions te
      INNER JOIN test_cases tc ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
    `

    const totalTests = parseInt(testCases[0]?.total || "0")
    const totalExec = parseInt(executions[0]?.total || "0")
    const passed = parseInt(executions[0]?.passed || "0")
    const failed = parseInt(executions[0]?.failed || "0")
    const blocked = parseInt(executions[0]?.blocked || "0")
    const skipped = parseInt(executions[0]?.skipped || "0")
    const passRate = totalExec > 0 ? Math.round((passed / totalExec) * 100) : 0

    const analytics = {
      testCases: {
        total: totalTests,
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        byType: { functional: 0, integration: 0, regression: 0, smoke: 0, ui: 0, api: 0 },
      },
      executions: {
        total: totalExec,
        passed,
        failed,
        blocked,
        skipped,
        pending: 0,
        passRate,
      },
      coverage: 0,
      trends: [],
      defects: {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      },
      executionByTester: [],
    }

    return NextResponse.json({ analytics })
  } catch (error: any) {
    console.error("Analytics error:", error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
})
