import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, type AuthenticatedRequest } from "@/lib/api-middleware"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit"
import { cache, CACHE_DURATION } from "@/lib/redis"

// GET analytics data
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("project_id")

    // Rate limiting
    const limitResult = await rateLimit(`analytics:get:${user.id}`, rateLimitConfigs.analytics)
    if (!limitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Check cache
    const cacheKey = `analytics:${projectId}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json({ analytics: cached, fromCache: true })
    }

    // Get test case statistics
    const testCaseStats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE priority = 'Critical') as critical,
        COUNT(*) FILTER (WHERE priority = 'High') as high,
        COUNT(*) FILTER (WHERE priority = 'Medium') as medium,
        COUNT(*) FILTER (WHERE priority = 'Low') as low,
        COUNT(*) FILTER (WHERE type = 'Functional') as functional,
        COUNT(*) FILTER (WHERE type = 'Integration') as integration,
        COUNT(*) FILTER (WHERE type = 'Regression') as regression,
        COUNT(*) FILTER (WHERE type = 'Smoke') as smoke,
        COUNT(*) FILTER (WHERE type = 'UI') as ui,
        COUNT(*) FILTER (WHERE type = 'API') as api
      FROM test_cases
      WHERE project_id = ${projectId}
    `

    // Get execution statistics
    const executionStats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Pass') as passed,
        COUNT(*) FILTER (WHERE status = 'Fail') as failed,
        COUNT(*) FILTER (WHERE status = 'Blocked') as blocked,
        COUNT(*) FILTER (WHERE status = 'Skipped') as skipped
      FROM test_executions te
      JOIN test_cases tc ON te.test_case_id = tc.id
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
        COUNT(*) FILTER (WHERE te.status = 'Pass') as passed,
        COUNT(*) FILTER (WHERE te.status = 'Fail') as failed,
        COUNT(*) FILTER (WHERE te.status = 'Blocked') as blocked,
        COUNT(*) FILTER (WHERE te.status = 'Skipped') as skipped
      FROM test_executions te
      JOIN test_cases tc ON te.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
      AND te.executed_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(te.executed_at)
      ORDER BY date
    `

    // Get defect statistics
    const defectStats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Open') as open,
        COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'Resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'Closed') as closed,
        COUNT(*) FILTER (WHERE severity = 'Critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'High') as high,
        COUNT(*) FILTER (WHERE severity = 'Medium') as medium,
        COUNT(*) FILTER (WHERE severity = 'Low') as low
      FROM defects d
      JOIN test_cases tc ON d.test_case_id = tc.id
      WHERE tc.project_id = ${projectId}
    `

    // Get test execution by tester
    const executionByTester = await sql`
      SELECT 
        u.full_name,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE te.status = 'Pass') as passed,
        COUNT(*) FILTER (WHERE te.status = 'Fail') as failed
      FROM test_executions te
      JOIN test_cases tc ON te.test_case_id = tc.id
      JOIN users u ON te.executed_by = u.id
      WHERE tc.project_id = ${projectId}
      AND te.executed_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.id, u.full_name
      ORDER BY total DESC
      LIMIT 5
    `

    // Calculate pass rate
    const totalExecutions = Number.parseInt(executionStats[0].total as string)
    const passedExecutions = Number.parseInt(executionStats[0].passed as string)
    const passRate = totalExecutions > 0 ? ((passedExecutions / totalExecutions) * 100).toFixed(1) : 0

    // Calculate test coverage (executed at least once)
    const totalTests = Number.parseInt(testCaseStats[0].total as string)
    const pendingCount = Number.parseInt(pendingTests[0].pending as string)
    const executedTests = totalTests - pendingCount
    const coverage = totalTests > 0 ? ((executedTests / totalTests) * 100).toFixed(1) : 0

    const analytics = {
      testCases: {
        total: Number.parseInt(testCaseStats[0].total as string),
        byPriority: {
          critical: Number.parseInt(testCaseStats[0].critical as string),
          high: Number.parseInt(testCaseStats[0].high as string),
          medium: Number.parseInt(testCaseStats[0].medium as string),
          low: Number.parseInt(testCaseStats[0].low as string),
        },
        byType: {
          functional: Number.parseInt(testCaseStats[0].functional as string),
          integration: Number.parseInt(testCaseStats[0].integration as string),
          regression: Number.parseInt(testCaseStats[0].regression as string),
          smoke: Number.parseInt(testCaseStats[0].smoke as string),
          ui: Number.parseInt(testCaseStats[0].ui as string),
          api: Number.parseInt(testCaseStats[0].api as string),
        },
      },
      executions: {
        total: totalExecutions,
        passed: passedExecutions,
        failed: Number.parseInt(executionStats[0].failed as string),
        blocked: Number.parseInt(executionStats[0].blocked as string),
        skipped: Number.parseInt(executionStats[0].skipped as string),
        pending: pendingCount,
        passRate: Number.parseFloat(passRate as string),
      },
      coverage: Number.parseFloat(coverage as string),
      trends: executionTrends,
      defects: {
        total: Number.parseInt(defectStats[0].total as string),
        open: Number.parseInt(defectStats[0].open as string),
        inProgress: Number.parseInt(defectStats[0].in_progress as string),
        resolved: Number.parseInt(defectStats[0].resolved as string),
        closed: Number.parseInt(defectStats[0].closed as string),
        bySeverity: {
          critical: Number.parseInt(defectStats[0].critical as string),
          high: Number.parseInt(defectStats[0].high as string),
          medium: Number.parseInt(defectStats[0].medium as string),
          low: Number.parseInt(defectStats[0].low as string),
        },
      },
      executionByTester,
    }

    // Cache the results
    await cache.set(cacheKey, analytics, CACHE_DURATION.ANALYTICS)

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("[v0] Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
