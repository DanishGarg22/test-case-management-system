// User types
export interface User {
  id: number
  email: string
  full_name: string
  role: "admin" | "test-lead" | "tester" | "read-only"
  created_at: string
  updated_at: string
}

// Project types
export interface Project {
  id: number
  name: string
  description: string | null
  version: string | null
  status: "active" | "archived" | "completed"
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  assigned_at: string
  user?: User
}

// Test case types
export interface TestCase {
  id: number
  project_id: number
  title: string
  description: string | null
  priority: "Low" | "Medium" | "High" | "Critical"
  type: "Functional" | "Integration" | "Regression" | "Smoke" | "UI" | "API"
  pre_conditions: string | null
  post_conditions: string | null
  tags: string[]
  created_by: number | null
  assigned_to: number | null
  created_at: string
  updated_at: string
}

export interface TestStep {
  id: number
  test_case_id: number
  step_number: number
  description: string
  expected_result: string
  created_at: string
}

// Test suite types
export interface TestSuite {
  id: number
  project_id: number
  name: string
  description: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

// Test execution types
export interface TestExecution {
  id: number
  test_case_id: number
  test_suite_id: number | null
  executed_by: number | null
  status: "Pass" | "Fail" | "Blocked" | "Skipped"
  comments: string | null
  attachments: string[]
  execution_time: number | null
  executed_at: string
}

// Defect types
export interface Defect {
  id: number
  test_execution_id: number
  test_case_id: number
  title: string
  description: string | null
  severity: "Low" | "Medium" | "High" | "Critical"
  status: "Open" | "In Progress" | "Resolved" | "Closed"
  created_by: number | null
  assigned_to: number | null
  created_at: string
  updated_at: string
}

// Analytics types
export interface TestAnalytics {
  total: number
  passed: number
  failed: number
  blocked: number
  skipped: number
  pending: number
  passRate: number
}
