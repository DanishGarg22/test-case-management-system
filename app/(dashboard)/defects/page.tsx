"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Bug, Calendar, User } from "lucide-react"
import type { Defect, Project } from "@/lib/types"

export default function DefectsPage() {
  const { token } = useAuth()
  const [defects, setDefects] = useState<Defect[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchProjects()
  }, [token])

  useEffect(() => {
    if (selectedProject) {
      fetchDefects()
    }
  }, [selectedProject, statusFilter, token])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects)
        if (data.projects.length > 0) {
          setSelectedProject(data.projects[0].id.toString())
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchDefects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        projectId: selectedProject,
      })
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const res = await fetch(`/api/defects?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDefects(data.defects)
      }
    } catch (error) {
      console.error("Failed to fetch defects:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      Critical: "destructive",
      High: "destructive",
      Medium: "default",
      Low: "secondary",
    }
    return colors[severity as keyof typeof colors] || "secondary"
  }

  const getStatusColor = (status: string) => {
    const colors = {
      Open: "default",
      "In Progress": "default",
      Resolved: "secondary",
      Closed: "outline",
    }
    return colors[status as keyof typeof colors] || "default"
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading defects...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Defects</h1>
        <p className="text-muted-foreground">Track and manage defects from test executions</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Project:</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label>Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {defects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bug className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No defects found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {defects.map((defect) => (
            <Card key={defect.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-5 w-5 text-destructive" />
                      {defect.title}
                    </CardTitle>
                    <CardDescription>{defect.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getSeverityColor(defect.severity) as any}>{defect.severity}</Badge>
                    <Badge variant={getStatusColor(defect.status) as any}>{defect.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Reported by: {defect.reporter_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(defect.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
