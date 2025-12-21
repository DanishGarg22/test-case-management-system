import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"

export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    console.log("Fetching projects...")

    const projects = await sql`
      SELECT 
        id,
        name,
        description,
        version,
        status,
        created_by,
        created_at,
        updated_at
      FROM projects
      ORDER BY created_at DESC
    `

    console.log("Projects found:", projects.length)
    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error("Projects error:", error)
    return NextResponse.json({ 
      projects: [],
      error: error.message 
    })
  }
})

export const POST = requireRole(["admin", "test-lead"])(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const body = await request.json()
    const { name, description, version, status = "active" } = body

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO projects (name, description, version, status, created_by)
      VALUES (${name}, ${description || null}, ${version || null}, ${status}, ${user.id})
      RETURNING *
    `

    const project = result[0]

    // Add creator as member
    try {
      await sql`
        INSERT INTO project_members (project_id, user_id)
        VALUES (${project.id}, ${user.id})
      `
    } catch (e) {
      console.error("Member add error:", e)
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error: any) {
    console.error("Create project error:", error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
})