import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth, requireRole, type AuthenticatedRequest } from "@/lib/api-middleware"

// GET all projects - SIMPLIFIED WITHOUT CACHE
export const GET = requireAuth(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    console.log("Fetching projects for user:", user.id, user.role)

    // Get projects based on role
    let projects
    
    try {
      if (user.role === "admin") {
        // Admin can see all projects - SIMPLIFIED QUERY
        projects = await sql`
          SELECT 
            p.id,
            p.name,
            p.description,
            p.version,
            p.status,
            p.created_by,
            p.created_at,
            p.updated_at,
            u.full_name as creator_name
          FROM projects p
          LEFT JOIN users u ON p.created_by = u.id
          ORDER BY p.created_at DESC
        `
      } else {
        // Others see only assigned projects - SIMPLIFIED QUERY
        projects = await sql`
          SELECT DISTINCT 
            p.id,
            p.name,
            p.description,
            p.version,
            p.status,
            p.created_by,
            p.created_at,
            p.updated_at,
            u.full_name as creator_name
          FROM projects p
          LEFT JOIN users u ON p.created_by = u.id
          INNER JOIN project_members pm ON p.id = pm.project_id
          WHERE pm.user_id = ${user.id}
          ORDER BY p.created_at DESC
        `
      }

      console.log("Projects fetched successfully:", projects.length)

      // Add test case count separately
      const projectsWithCount = await Promise.all(
        projects.map(async (project) => {
          try {
            const countResult = await sql`
              SELECT COUNT(*) as count 
              FROM test_cases 
              WHERE project_id = ${project.id}
            `
            return {
              ...project,
              test_case_count: parseInt(countResult[0]?.count?.toString() || "0")
            }
          } catch (err) {
            console.error("Error counting test cases for project:", project.id, err)
            return {
              ...project,
              test_case_count: 0
            }
          }
        })
      )

      return NextResponse.json({ projects: projectsWithCount })
    } catch (dbError: any) {
      console.error("Database query error:", dbError)
      console.error("Error details:", dbError.message)
      
      // Return empty array instead of error to unblock UI
      return NextResponse.json({ 
        projects: [],
        error: "Database query failed, please check your database schema" 
      })
    }
  } catch (error: any) {
    console.error("Get projects error:", error)
    console.error("Error stack:", error.stack)
    
    return NextResponse.json({ 
      error: "Internal server error: " + error.message,
      projects: []
    }, { status: 500 })
  }
})

// POST create new project (admin and test-lead only)
export const POST = requireRole(["admin", "test-lead"])(async (request: AuthenticatedRequest) => {
  try {
    const user = request.user!
    const body = await request.json()
    const { name, description, version, status = "active" } = body

    console.log("Creating project:", { name, user: user.id })

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
    console.log("Project created:", project.id)

    // Automatically add creator as project member
    try {
      await sql`
        INSERT INTO project_members (project_id, user_id)
        VALUES (${project.id}, ${user.id})
      `
      console.log("Project member added")
    } catch (memberError) {
      console.error("Failed to add project member:", memberError)
      // Continue anyway, project was created
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error: any) {
    console.error("Create project error:", error)
    return NextResponse.json({ 
      error: "Failed to create project: " + error.message 
    }, { status: 500 })
  }
})