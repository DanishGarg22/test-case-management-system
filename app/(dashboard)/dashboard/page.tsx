"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusPieChart } from "@/components/analytics/status-pie-chart"
import { TrendsLineChart } from "@/components/analytics/trends-line-chart"
import { PriorityBarChart } from "@/components/analytics/priority-bar-chart"
import { FolderKanban, FileCheck, PlayCircle, AlertCircle, TrendingUp, Target } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchAnalytics()
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      console.log("Fetching projects...");
      const response = await fetch("/api/projects", {
        credentials: "include",
        cache: "no-store",
      })
      
      console.log("Projects response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }
      
      const data = await response.json()
      console.log("Projects data:", data);
      
      setProjects(data.projects || [])
      if (data.projects && data.projects.length > 0) {
        setSelectedProject(data.projects[0].id.toString())
      } else {
        setError("No projects found. Please create a project first.")
      }
    } catch (error: any) {
      console.error("Failed to fetch projects:", error)
      setError(error.message || "Failed to load projects")
      setProjects([])
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("Fetching analytics for project:", selectedProject);
      
      const response = await fetch(`/api/analytics?project_id=${selectedProject}`, {
        credentials: "include",
        cache: "no-store",
      })
      
      console.log("Analytics response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json()
      console.log("Analytics data:", data);
      
      setAnalytics(data.analytics)
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error)
      setError(error.message || "Failed to load analytics")
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    if (!analytics) return []

    return [
      {
        title: "Total Test Cases",
        value: analytics.testCases?.total || 0,
        icon: FileCheck,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-950",
      },
      {
        title: "Test Executions",
        value: analytics.executions?.total || 0,
        icon: PlayCircle,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-950",
      },
      {
        title: "Pass Rate",
        value: `${analytics.executions?.passRate || 0}%`,
        icon: TrendingUp,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100 dark:bg-emerald-950",
      },
      {
        title: "Test Coverage",
        value: `${analytics.coverage || 0}%`,
        icon: Target,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-950",
      },
      {
        title: "Open Defects",
        value: analytics.defects?.open || 0,
        icon: AlertCircle,
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-950",
      },
      {
        title: "Pending Tests",
        value: analytics.executions?.pending || 0,
        icon: FolderKanban,
        color: "text-orange-600",
        bgColor: "bg-orange-100 dark:bg-orange-950",
      },
    ]
  }, [analytics])

  if (error && projects.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Please check your database connection and try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.full_name || "User"}!</h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your testing activities</p>
        </div>
        {projects.length > 0 && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      ) : !analytics ? (
        <div className="text-center py-12">
          <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">No analytics data available</p>
          <p className="text-sm text-muted-foreground mt-2">Create some test cases and execute them to see analytics.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusPieChart data={analytics.executions} />
            <PriorityBarChart data={analytics.testCases.byPriority} />
          </div>

          {analytics.trends && analytics.trends.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              <TrendsLineChart data={analytics.trends} />
            </div>
          )}

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Cases by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.testCases.byType || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{type}</span>
                      <span className="text-sm text-muted-foreground">{count as number}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Testers (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.executionByTester && analytics.executionByTester.length > 0 ? (
                    analytics.executionByTester.map((tester: any) => (
                      <div key={tester.full_name} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tester.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tester.passed} passed / {tester.failed} failed
                          </p>
                        </div>
                        <span className="text-sm font-medium">{tester.total} total</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No execution data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Defect Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Defect Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">{analytics.defects?.open || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{analytics.defects?.inProgress || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{analytics.defects?.resolved || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Closed</p>
                  <p className="text-2xl font-bold">{analytics.defects?.closed || 0}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">By Severity:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Critical</p>
                    <p className="text-lg font-semibold text-red-600">{analytics.defects?.bySeverity?.critical || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">High</p>
                    <p className="text-lg font-semibold text-orange-600">{analytics.defects?.bySeverity?.high || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Medium</p>
                    <p className="text-lg font-semibold text-yellow-600">{analytics.defects?.bySeverity?.medium || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="text-lg font-semibold text-green-600">{analytics.defects?.bySeverity?.low || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}