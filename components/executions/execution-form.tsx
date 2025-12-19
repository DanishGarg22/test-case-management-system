"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, MinusCircle, Ban } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ExecutionFormProps {
  testCase: any
  onSubmit: (data: any) => Promise<void>
  onCreateDefect: (data: any) => Promise<void>
}

export function ExecutionForm({ testCase, onSubmit, onCreateDefect }: ExecutionFormProps) {
  const [status, setStatus] = useState<string>("")
  const [comments, setComments] = useState("")
  const [executionTime, setExecutionTime] = useState("")
  const [showDefectForm, setShowDefectForm] = useState(false)
  const [defectData, setDefectData] = useState({
    title: "",
    description: "",
    severity: "Medium",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        test_case_id: testCase.id,
        status,
        comments,
        execution_time: executionTime ? Number.parseInt(executionTime) : null,
      })

      // Reset form
      setStatus("")
      setComments("")
      setExecutionTime("")
      setShowDefectForm(false)
    } catch (error) {
      console.error("[v0] Execution submit error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDefectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onCreateDefect({
        test_case_id: testCase.id,
        ...defectData,
      })

      // Reset defect form
      setDefectData({ title: "", description: "", severity: "Medium" })
      setShowDefectForm(false)
    } catch (error) {
      console.error("[v0] Defect creation error:", error)
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: "Pass", label: "Pass", icon: CheckCircle2, color: "text-green-600" },
    { value: "Fail", label: "Fail", icon: XCircle, color: "text-red-600" },
    { value: "Blocked", label: "Blocked", icon: Ban, color: "text-orange-600" },
    { value: "Skipped", label: "Skipped", icon: MinusCircle, color: "text-gray-600" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Execute Test Case</CardTitle>
          <CardDescription>Record the test execution results</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Test Result *</Label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                      status === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    <option.icon
                      className={`h-5 w-5 ${status === option.value ? option.color : "text-muted-foreground"}`}
                    />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                placeholder="Add any observations, issues, or notes..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="executionTime">Execution Time (seconds)</Label>
              <Input
                id="executionTime"
                type="number"
                value={executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
                placeholder="e.g., 45"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!status || loading}>
                {loading ? "Submitting..." : "Submit Result"}
              </Button>
              {status === "Fail" && (
                <Button type="button" variant="outline" onClick={() => setShowDefectForm(!showDefectForm)}>
                  {showDefectForm ? "Cancel Defect" : "Create Defect"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {showDefectForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Defect</CardTitle>
            <CardDescription>Log a defect from this failed test</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDefectSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defectTitle">Defect Title *</Label>
                <Input
                  id="defectTitle"
                  value={defectData.title}
                  onChange={(e) => setDefectData({ ...defectData, title: e.target.value })}
                  required
                  placeholder="Brief description of the issue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defectDescription">Description</Label>
                <Textarea
                  id="defectDescription"
                  value={defectData.description}
                  onChange={(e) => setDefectData({ ...defectData, description: e.target.value })}
                  rows={4}
                  placeholder="Detailed description, steps to reproduce, expected vs actual results..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={defectData.severity}
                  onValueChange={(v) => setDefectData({ ...defectData, severity: v })}
                >
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

              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Defect"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
