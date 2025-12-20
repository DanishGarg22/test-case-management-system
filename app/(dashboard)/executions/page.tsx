"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchExecutions()
    }
  }, [selectedProject, statusFilter])

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

  const fetchExecutions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        project_id: selectedProject,
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/executions?${params}`, {
        credentials: "include"
      })
      const data = await response.json()
      setExecutions(data.executions)
    } catch (error) {
      console.error("[v0] Failed to fetch executions:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Test Executions</h1>
        <p className="text-muted-foreground mt-1">View and track test execution results</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Statuses</SelectItem>
            <SelectItem value="Pass">Pass</SelectItem>
            <SelectItem value="Fail">Fail</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
            <SelectItem value="Skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading executions...</div>
      ) : executions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No executions found</div>
      ) : (
        <div className="grid gap-4">
          {executions.map((execution) => (
            <Card key={execution.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      <Link href={`/test-cases/${execution.test_case_id}`} className="hover:underline">
                        {execution.test_case_title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      Executed by {execution.executed_by_name} on {new Date(execution.executed_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        execution.status === "Pass"
                          ? "default"
                          : execution.status === "Fail"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {execution.status}
                    </Badge>
                    {execution.test_case_priority && (
                      <Badge variant={execution.test_case_priority === "Critical" ? "destructive" : "outline"}>
                        {execution.test_case_priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {execution.comments && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{execution.comments}</p>
                  {execution.execution_time && (
                    <p className="text-xs text-muted-foreground mt-2">Execution time: {execution.execution_time}s</p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
