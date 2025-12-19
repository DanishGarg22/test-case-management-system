"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FolderKanban, FileCheck, PlayCircle, BarChart3, Users, LogOut, Moon, Sun } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "test-lead", "tester", "read-only"],
  },
  { name: "Projects", href: "/projects", icon: FolderKanban, roles: ["admin", "test-lead", "tester", "read-only"] },
  { name: "Test Cases", href: "/test-cases", icon: FileCheck, roles: ["admin", "test-lead", "tester", "read-only"] },
  { name: "Test Execution", href: "/executions", icon: PlayCircle, roles: ["admin", "test-lead", "tester"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin", "test-lead", "tester", "read-only"] },
  { name: "Users", href: "/users", icon: Users, roles: ["admin"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, hasRole } = useAuth()
  const { theme, toggleTheme } = useTheme()

  if (!user) return null

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-semibold text-lg">TestFlow</h1>
          <p className="text-xs text-muted-foreground">QA Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          if (!hasRole(item.roles)) return null

          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.replace("-", " ")}</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full justify-start">
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === "dark" ? "Light" : "Dark"} Mode
        </Button>

        <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
