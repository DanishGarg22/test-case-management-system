"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusPieChart } from "@/components/analytics/status-pie-chart"
import { TrendsLineChart } from "@/components/analytics/trends-line-chart"
import { PriorityBarChart } from "@/components/analytics/priority-bar-chart"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
      const response = await fetch("/api/projects", {
        credentials: "include"
      })
      const data = await response.json()
      setProjects(data.projects)
      if (data.projects.length > 0) {
        setSelectedProject(data.projects[0].id.toString())
      }
    } catch (error) {
      console.error("[v0] Failed to fetch projects:", error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?project_id=${selectedProject}`, {
        credentials: "include"
      })
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error("[v0] Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!analytics) return

    const dataStr = JSON.stringify(analytics, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `analytics-${selectedProject}-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">Comprehensive testing metrics and insights</p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline" onClick={handleExport} disabled={!analytics}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : !analytics ? (
        <div className="text-center py-12 text-muted-foreground">No analytics data available</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Coverage</CardTitle>
                <CardDescription>Percentage of tests executed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{analytics.coverage}%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {analytics.testCases.total - analytics.executions.pending} of {analytics.testCases.total} tests
                  executed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pass Rate</CardTitle>
                <CardDescription>Successful test executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{analytics.executions.passRate}%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {analytics.executions.passed} of {analytics.executions.total} executions passed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Defect Density</CardTitle>
                <CardDescription>Defects per test case</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {analytics.testCases.total > 0
                    ? (analytics.defects.total / analytics.testCases.total).toFixed(2)
                    : "0.00"}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{analytics.defects.total} total defects logged</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusPieChart data={analytics.executions} />
            <PriorityBarChart data={analytics.testCases.byPriority} />
          </div>

          {analytics.trends.length > 0 && <TrendsLineChart data={analytics.trends} />}
        </div>
      )}
    </div>
  )
}
