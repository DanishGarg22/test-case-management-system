"use client"

import type React from "react"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface TestCaseFiltersProps {
  filters: {
    search: string
    priority: string
    type: string
    assignee: string
  }
  onFilterChange: (key: string, value: string) => void
  assignees: Array<{ id: number; name: string }>
}

export function TestCaseFilters({ filters, onFilterChange, assignees }: TestCaseFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange("search", e.target.value)
    },
    [onFilterChange],
  )

  const handlePriorityChange = useCallback(
    (value: string) => {
      onFilterChange("priority", value)
    },
    [onFilterChange],
  )

  const handleTypeChange = useCallback(
    (value: string) => {
      onFilterChange("type", value)
    },
    [onFilterChange],
  )

  const handleAssigneeChange = useCallback(
    (value: string) => {
      onFilterChange("assignee", value)
    },
    [onFilterChange],
  )

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search test cases..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <Select value={filters.priority} onValueChange={handlePriorityChange}>
          <SelectTrigger>
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={filters.type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Functional">Functional</SelectItem>
            <SelectItem value="Integration">Integration</SelectItem>
            <SelectItem value="Regression">Regression</SelectItem>
            <SelectItem value="Smoke">Smoke</SelectItem>
            <SelectItem value="UI">UI</SelectItem>
            <SelectItem value="API">API</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Assignee</Label>
        <Select value={filters.assignee} onValueChange={handleAssigneeChange}>
          <SelectTrigger>
            <SelectValue placeholder="All assignees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {assignees.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id.toString()}>
                {assignee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
