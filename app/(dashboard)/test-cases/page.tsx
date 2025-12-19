"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TestCaseTable } from "@/components/test-cases/test-case-table"
import { Plus, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function TestCasesPage() {
  const { hasRole } = useAuth()
  const [testCases, setTestCases] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [priorityFilter, setPriorityFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    type: "Functional",
    assigned_to: "",
    pre_conditions: "",
    post_conditions: "",
    tags: "",
  })

  const canEdit = hasRole(["admin", "test-lead"])

  useEffect(() => {
    Promise.all([fetchProjects(), fetchUsers()])
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchTestCases()
    }
  }, [selectedProject, priorityFilter, typeFilter, searchTerm])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data.projects)
      if (data.projects.length > 0) {
        setSelectedProject(data.projects[0].id.toString())
      }
    } catch (error) {
      console.error("[v0] Failed to fetch projects:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error("[v0] Failed to fetch users:", error)
    }
  }

  const fetchTestCases = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        project_id: selectedProject,
        ...(priorityFilter && { priority: priorityFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/test-cases?${params}`)
      const data = await response.json()
      setTestCases(data.testCases)
    } catch (error) {
      console.error("[v0] Failed to fetch test cases:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedProject, priorityFilter, typeFilter, searchTerm])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const response = await fetch("/api/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          project_id: selectedProject,
          tags: tagsArray,
          assigned_to: formData.assigned_to || null,
        }),
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        setFormData({
          title: "",
          description: "",
          priority: "Medium",
          type: "Functional",
          assigned_to: "",
          pre_conditions: "",
          post_conditions: "",
          tags: "",
        })
        fetchTestCases()
      }
    } catch (error) {
      console.error("[v0] Failed to create test case:", error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      await fetch("/api/test-cases/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "delete",
          test_case_ids: selectedIds,
        }),
      })
      setBulkDialogOpen(false)
      setSelectedIds([])
      fetchTestCases()
    } catch (error) {
      console.error("[v0] Failed to delete test cases:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Cases</h1>
          <p className="text-muted-foreground mt-1">Manage and organize your test cases</p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Test Case
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
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

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search test cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Priorities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Types</SelectItem>
            <SelectItem value="Functional">Functional</SelectItem>
            <SelectItem value="Integration">Integration</SelectItem>
            <SelectItem value="Regression">Regression</SelectItem>
            <SelectItem value="Smoke">Smoke</SelectItem>
            <SelectItem value="UI">UI</SelectItem>
            <SelectItem value="API">API</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {canEdit && selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
          <Button variant="destructive" size="sm" onClick={() => setBulkDialogOpen(true)}>
            Delete Selected
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading test cases...</div>
      ) : (
        <TestCaseTable testCases={testCases} canEdit={canEdit} selectedIds={selectedIds} onSelectIds={setSelectedIds} />
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create New Test Case</DialogTitle>
              <DialogDescription>Add a new test case to your project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Functional">Functional</SelectItem>
                      <SelectItem value="Integration">Integration</SelectItem>
                      <SelectItem value="Regression">Regression</SelectItem>
                      <SelectItem value="Smoke">Smoke</SelectItem>
                      <SelectItem value="UI">UI</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="login, authentication, critical-path"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Test Case</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} test case(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
