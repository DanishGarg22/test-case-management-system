"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Folder, PlayCircle } from "lucide-react"
import type { Project, TestSuite } from "@/lib/types"

export default function TestSuitesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "",
  })

  const canCreate = user?.role === "admin" || user?.role === "test-lead"

  useEffect(() => {
    fetchProjects()
  }, [token])

  useEffect(() => {
    if (selectedProject) {
      fetchSuites()
    }
  }, [selectedProject, token])

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

  const fetchSuites = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/test-suites?projectId=${selectedProject}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSuites(data.suites)
      }
    } catch (error) {
      console.error("Failed to fetch suites:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/test-suites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          projectId: selectedProject,
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Test suite created successfully",
        })
        setDialogOpen(false)
        setFormData({ name: "", description: "", projectId: "" })
        fetchSuites()
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create test suite",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test suite",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading test suites...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Suites</h1>
          <p className="text-muted-foreground">Organize test cases into logical groups</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Suite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Test Suite</DialogTitle>
                  <DialogDescription>Create a new test suite to organize your test cases</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Suite Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Regression Suite"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Suite description..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Suite</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Label>Project:</Label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[300px]">
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

      {suites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No test suites found</p>
            {canCreate && <p className="text-sm text-muted-foreground">Create your first test suite to get started</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suites.map((suite) => (
            <Card key={suite.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{suite.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{suite.test_case_count || 0} tests</Badge>
                </div>
                <CardDescription className="line-clamp-2">{suite.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    View Details
                  </Button>
                  {user?.role !== "read-only" && (
                    <Button size="sm" className="flex-1">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Execute Suite
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
