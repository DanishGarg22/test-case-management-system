import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, type AuthenticatedRequest } from "@/lib/api-middleware"

// GET analytics data - SIMPLIFIED WITHOUT CACHE
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")

    console.log("Fetching analytics for project:", projectId)

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    try {
      // Get test case statistics
      const testCaseStats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical,
          COUNT(CASE WHEN priority = 'High' THEN 1 END) as high,
          COUNT(CASE WHEN priority = 'Medium' THEN 1 END) as medium,
          COUNT(CASE WHEN priority = 'Low' THEN 1 END) as low,
          COUNT(CASE WHEN type = 'Functional' THEN 1 END) as functional,
          COUNT(CASE WHEN type = 'Integration' THEN 1 END) as integration,
          COUNT(CASE WHEN type = 'Regression' THEN 1 END) as regression,
          COUNT(CASE WHEN type = 'Smoke' THEN 1 END) as smoke,
          COUNT(CASE WHEN type = 'UI' THEN 1 END) as ui,
          COUNT(CASE WHEN type = 'API' THEN 1 END) as api
        FROM test_cases
        WHERE project_id = ${projectId}
      `

      // Get execution statistics
      const executionStats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN te.status = 'Pass' THEN 1 END) as passed,
          COUNT(CASE WHEN te.status = 'Fail' THEN 1 END) as failed,
          COUNT(CASE WHEN te.status = 'Blocked' THEN 1 END) as blocked,
          COUNT(CASE WHEN te.status = 'Skipped' THEN 1 END) as skipped
        FROM test_executions te
        INNER JOIN test_cases tc ON te.test_case_id = tc.id
        WHERE tc.project_id = ${projectId}
      `

      // Get pending test cases (never executed)
      const pendingTests = await sql`
        SELECT COUNT(*) as pending
        FROM test_cases tc
        WHERE tc.project_id = ${projectId}
        AND NOT EXISTS (
          SELECT 1 FROM test_executions te WHERE te.test_case_id = tc.id
        )
      `

      // Get execution trends (last 7 days)
      const executionTrends = await sql`
        SELECT 
          DATE(te.executed_at) as date,
          COUNT(CASE WHEN te.status = 'Pass' THEN 1 END) as passed,
          COUNT(CASE WHEN te.status = 'Fail' THEN 1 END) as failed,
          COUNT(CASE WHEN te.status = 'Blocked' THEN 1 END) as blocked,
          COUNT(CASE WHEN te.status = 'Skipped' THEN 1 END) as skipped
        FROM test_executions te
        INNER JOIN test_cases tc ON te.test_case_id = tc.id
        WHERE tc.project_id = ${projectId}
        AND te.executed_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(te.executed_at)
        ORDER BY date
      `

      // Get defect statistics
      const defectStats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN d.status = 'Open' THEN 1 END) as open,
          COUNT(CASE WHEN d.status = 'In Progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN d.status = 'Resolved' THEN 1 END) as resolved,
          COUNT(CASE WHEN d.status = 'Closed' THEN 1 END) as closed,
          COUNT(CASE WHEN d.severity = 'Critical' THEN 1 END) as critical,
          COUNT(CASE WHEN d.severity = 'High' THEN 1 END) as high,
          COUNT(CASE WHEN d.severity = 'Medium' THEN 1 END) as medium,
          COUNT(CASE WHEN d.severity = 'Low' THEN 1 END) as low
        FROM defects d
        WHERE d.test_case_id IN (
          SELECT id FROM test_cases WHERE project_id = ${projectId}
        )
      `

      // Get test execution by tester
      const executionByTester = await sql`
        SELECT 
          u.full_name,
          COUNT(*) as total,
          COUNT(CASE WHEN te.status = 'Pass' THEN 1 END) as passed,
          COUNT(CASE WHEN te.status = 'Fail' THEN 1 END) as failed
        FROM test_executions te
        INNER JOIN test_cases tc ON te.test_case_id = tc.id
        INNER JOIN users u ON te.executed_by = u.id
        WHERE tc.project_id = ${projectId}
        AND te.executed_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY u.id, u.full_name
        ORDER BY total DESC
        LIMIT 5
      `

      // Calculate pass rate
      const totalExecutions = parseInt(executionStats[0]?.total?.toString() || "0")
      const passedExecutions = parseInt(executionStats[0]?.passed?.toString() || "0")
      const passRate = totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0

      // Calculate test coverage
      const totalTests = parseInt(testCaseStats[0]?.total?.toString() || "0")
      const pendingCount = parseInt(pendingTests[0]?.pending?.toString() || "0")
      const executedTests = totalTests - pendingCount
      const coverage = totalTests > 0 ? Math.round((executedTests / totalTests) * 100) : 0

      const analytics = {
        testCases: {
          total: totalTests,
          byPriority: {
            critical: parseInt(testCaseStats[0]?.critical?.toString() || "0"),
            high: parseInt(testCaseStats[0]?.high?.toString() || "0"),
            medium: parseInt(testCaseStats[0]?.medium?.toString() || "0"),
            low: parseInt(testCaseStats[0]?.low?.toString() || "0"),
          },
          byType: {
            functional: parseInt(testCaseStats[0]?.functional?.toString() || "0"),
            integration: parseInt(testCaseStats[0]?.integration?.toString() || "0"),
            regression: parseInt(testCaseStats[0]?.regression?.toString() || "0"),
            smoke: parseInt(testCaseStats[0]?.smoke?.toString() || "0"),
            ui: parseInt(testCaseStats[0]?.ui?.toString() || "0"),
            api: parseInt(testCaseStats[0]?.api?.toString() || "0"),
          },
        },
        executions: {
          total: totalExecutions,
          passed: passedExecutions,
          failed: parseInt(executionStats[0]?.failed?.toString() || "0"),
          blocked: parseInt(executionStats[0]?.blocked?.toString() || "0"),
          skipped: parseInt(executionStats[0]?.skipped?.toString() || "0"),
          pending: pendingCount,
          passRate: passRate,
        },
        coverage: coverage,
        trends: executionTrends || [],
        defects: {
          total: parseInt(defectStats[0]?.total?.toString() || "0"),
          open: parseInt(defectStats[0]?.open?.toString() || "0"),
          inProgress: parseInt(defectStats[0]?.in_progress?.toString() || "0"),
          resolved: parseInt(defectStats[0]?.resolved?.toString() || "0"),
          closed: parseInt(defectStats[0]?.closed?.toString() || "0"),
          bySeverity: {
            critical: parseInt(defectStats[0]?.critical?.toString() || "0"),
            high: parseInt(defectStats[0]?.high?.toString() || "0"),
            medium: parseInt(defectStats[0]?.medium?.toString() || "0"),
            low: parseInt(defectStats[0]?.low?.toString() || "0"),
          },
        },
        executionByTester: executionByTester || [],
      }

      console.log("Analytics calculated successfully")
      return NextResponse.json({ analytics })
      
    } catch (dbError: any) {
      console.error("Database query error in analytics:", dbError)
      console.error("Error message:", dbError.message)
      
      return NextResponse.json({ 
        error: "Failed to fetch analytics: " + dbError.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Analytics error:", error)
    return NextResponse.json({ 
      error: "Internal server error: " + error.message 
    }, { status: 500 })
  }
})