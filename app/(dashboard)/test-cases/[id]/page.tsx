"use client"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExecutionForm } from "@/components/executions/execution-form"
import { ArrowLeft, FileText, ListChecks, History } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { hasRole } = useAuth()
  const [testCase, setTestCase] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestCase()
  }, [])

  const fetchTestCase = async () => {
    try {
      const response = await fetch(`/api/test-cases/${resolvedParams.id}`, {
        credentials: "include"
      })
      const data = await response.json()
      setTestCase(data.testCase)
    } catch (error) {
      console.error("[v0] Failed to fetch test case:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExecutionSubmit = async (data: any) => {
    try {
      await fetch("/api/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })

      fetchTestCase() // Refresh to show new execution
    } catch (error) {
      console.error("[v0] Execution failed:", error)
      throw error
    }
  }

  const handleDefectCreate = async (data: any) => {
    try {
      await fetch("/api/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error("[v0] Defect creation failed:", error)
      throw error
    }
  }

  const canExecute = hasRole(["admin", "test-lead", "tester"])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!testCase) {
    return <div className="p-8">Test case not found</div>
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "destructive"
      case "High":
        return "default"
      case "Medium":
        return "secondary"
      case "Low":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/test-cases">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Test Cases
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{testCase.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getPriorityColor(testCase.priority) as any}>{testCase.priority}</Badge>
              <Badge variant="outline">{testCase.type}</Badge>
              {testCase.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Project:</span>
            <p className="font-medium">{testCase.project_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Created by:</span>
            <p className="font-medium">{testCase.created_by_name || "Unknown"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Assigned to:</span>
            <p className="font-medium">{testCase.assigned_to_name || "Unassigned"}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="steps">
            <ListChecks className="mr-2 h-4 w-4" />
            Steps ({testCase.steps?.length || 0})
          </TabsTrigger>
          {canExecute && <TabsTrigger value="execute">Execute</TabsTrigger>}
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History ({testCase.executions?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{testCase.description || "No description provided"}</p>
              </CardContent>
            </Card>

            {testCase.pre_conditions && (
              <Card>
                <CardHeader>
                  <CardTitle>Pre-conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{testCase.pre_conditions}</p>
                </CardContent>
              </Card>
            )}

            {testCase.post_conditions && (
              <Card>
                <CardHeader>
                  <CardTitle>Post-conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{testCase.post_conditions}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle>Test Steps</CardTitle>
              <CardDescription>Follow these steps to execute the test</CardDescription>
            </CardHeader>
            <CardContent>
              {testCase.steps?.length === 0 ? (
                <p className="text-muted-foreground">No test steps defined</p>
              ) : (
                <div className="space-y-4">
                  {testCase.steps?.map((step: any) => (
                    <div key={step.id} className="border-l-2 border-primary pl-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                          {step.step_number}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{step.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Expected:</span> {step.expected_result}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canExecute && (
          <TabsContent value="execute">
            <ExecutionForm testCase={testCase} onSubmit={handleExecutionSubmit} onCreateDefect={handleDefectCreate} />
          </TabsContent>
        )}

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent test execution results</CardDescription>
            </CardHeader>
            <CardContent>
              {testCase.executions?.length === 0 ? (
                <p className="text-muted-foreground">No execution history</p>
              ) : (
                <div className="space-y-4">
                  {testCase.executions?.map((execution: any) => (
                    <div key={execution.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div>
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
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{execution.executed_by_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(execution.executed_at).toLocaleString()}
                        </p>
                        {execution.comments && <p className="text-sm mt-2">{execution.comments}</p>}
                        {execution.execution_time && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {execution.execution_time}s execution time
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
