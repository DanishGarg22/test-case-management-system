import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit"
import { cache, CACHE_DURATION } from "@/lib/redis"

// GET all projects (with caching)
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!

    // Rate limiting
    const limitResult = await rateLimit(`projects:get:${user.id}`, rateLimitConfigs.testcase)
    if (!limitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // Try to get from cache
    const cacheKey = `projects:user:${user.id}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json({ projects: cached, fromCache: true })
    }

    // Get projects based on role
    let projects
    if (user.role === "admin") {
      // Admin can see all projects
      projects = await sql`
        SELECT p.*, u.full_name as creator_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.created_at DESC
      `
    } else {
      // Others see only assigned projects
      projects = await sql`
        SELECT DISTINCT p.*, u.full_name as creator_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        INNER JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = ${user.id}
        ORDER BY p.created_at DESC
      `
    }

    // Cache the results
    await cache.set(cacheKey, projects, CACHE_DURATION.PROJECT_METADATA)

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("[v0] Get projects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

// POST create new project (admin and test-lead only)
export const POST = requireRole(["admin", "test-lead"])(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const body = await request.json()
    const { name, description, version, status = "active" } = body

    // Validation
    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedName = name.trim().replace(/[<>]/g, "")
    const sanitizedDescription = description?.trim().replace(/[<>]/g, "") || null
    const sanitizedVersion = version?.trim() || null

    // Create project
    const result = await sql`
      INSERT INTO projects (name, description, version, status, created_by)
      VALUES (${sanitizedName}, ${sanitizedDescription}, ${sanitizedVersion}, ${status}, ${user.id})
      RETURNING *
    `

    const project = result[0]

    // Automatically add creator as project member
    await sql`
      INSERT INTO project_members (project_id, user_id)
      VALUES (${project.id}, ${user.id})
    `

    // Invalidate cache
    await cache.delPattern("projects:*")

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
