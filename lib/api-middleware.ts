import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasRole } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number
    email: string
    full_name: string
    role: "admin" | "test-lead" | "tester" | "read-only"
  }
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const user = await getCurrentUser()

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const authRequest = request as AuthenticatedRequest
      authRequest.user = user

      return handler(authRequest)
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}

export function requireRole(allowedRoles: string[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return requireAuth(async (request: AuthenticatedRequest) => {
      if (!request.user || !hasRole(request.user, allowedRoles)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return handler(request)
    })
  }
}