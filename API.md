# API Reference

Complete API documentation for the Test Case Management System.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

Tokens expire after 24 hours and must be refreshed by logging in again.

---

## Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "name": "string (required, min 2 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "role": "string (optional, default: tester)"
}
```

**Valid Roles:**
- `admin`: Full system access
- `test-lead`: Manage test cases and execute tests
- `tester`: Execute tests and report defects
- `read-only`: View-only access

**Success Response (201):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "tester",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists
- `429 Too Many Requests`: Rate limit exceeded

---

### Login

```http
POST /api/auth/login
```

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "tester"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

---

### Get Current User

```http
GET /api/auth/me
```

**Authentication:** Required

**Success Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "tester",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired token

---

### Logout

```http
POST /api/auth/logout
```

**Authentication:** Required

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Project Endpoints

### List Projects

```http
GET /api/projects?page=1&limit=20
```

**Authentication:** Required  
**Rate Limit:** 100 requests per hour  
**Cache:** 1 hour

**Query Parameters:**
- `page` (integer, optional, default: 1)
- `limit` (integer, optional, default: 20, max: 100)

**Success Response (200):**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "E-commerce Platform",
      "description": "Main e-commerce testing project",
      "version": "2.1.0",
      "status": "active",
      "created_by": 1,
      "creator_name": "Admin User",
      "created_at": "2025-01-01T00:00:00Z",
      "test_case_count": 150
    }
  ],
  "total": 5,
  "page": 1,
  "totalPages": 1
}
```

---

### Create Project

```http
POST /api/projects
```

**Authentication:** Required (admin or test-lead only)  
**Rate Limit:** 100 requests per hour

**Request Body:**
```json
{
  "name": "string (required, min 3 chars)",
  "description": "string (optional)",
  "version": "string (optional, default: 1.0.0)",
  "status": "string (optional, default: active)"
}
```

**Valid Status Values:**
- `active`
- `archived`

**Success Response (201):**
```json
{
  "id": 6,
  "name": "Mobile App",
  "description": "Mobile testing project",
  "version": "1.0.0",
  "status": "active",
  "created_by": 1,
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Error Responses:**
- `403 Forbidden`: User role not authorized
- `400 Bad Request`: Invalid input

---

### Update Project

```http
PUT /api/projects/:id
```

**Authentication:** Required (admin or test-lead only)  
**Rate Limit:** 100 requests per hour

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "version": "string (optional)",
  "status": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Updated Project Name",
  "description": "Updated description",
  "version": "2.0.0",
  "status": "active",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

### Delete Project

```http
DELETE /api/projects/:id
```

**Authentication:** Required (admin only)  
**Rate Limit:** 100 requests per hour

**Success Response (200):**
```json
{
  "message": "Project deleted successfully"
}
```

---

## Test Case Endpoints

### List Test Cases

```http
GET /api/test-cases?projectId=1&page=1&limit=20&priority=High&type=Functional&search=login&assigneeId=2
```

**Authentication:** Required  
**Rate Limit:** 100 requests per hour  
**Cache:** 10 minutes

**Query Parameters:**
- `projectId` (integer, required)
- `page` (integer, optional, default: 1)
- `limit` (integer, optional, default: 20)
- `priority` (string, optional): Low, Medium, High, Critical
- `type` (string, optional): Functional, Integration, Regression, Smoke, UI, API
- `assigneeId` (integer, optional)
- `search` (string, optional): Search in title and description

**Success Response (200):**
```json
{
  "testCases": [
    {
      "id": 1,
      "project_id": 1,
      "title": "Login with valid credentials",
      "description": "Verify user can login with correct email and password",
      "priority": "High",
      "type": "Functional",
      "pre_conditions": "User account exists",
      "post_conditions": "User is logged in",
      "tags": ["authentication", "login"],
      "assignee_id": 2,
      "assignee_name": "Jane Tester",
      "created_by": 1,
      "creator_name": "Admin User",
      "created_at": "2025-01-10T00:00:00Z",
      "last_execution_status": "Pass",
      "last_execution_date": "2025-01-14T15:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

---

### Get Test Case Details

```http
GET /api/test-cases/:id
```

**Authentication:** Required  
**Rate Limit:** 100 requests per hour

**Success Response (200):**
```json
{
  "id": 1,
  "project_id": 1,
  "title": "Login with valid credentials",
  "description": "Detailed description...",
  "priority": "High",
  "type": "Functional",
  "pre_conditions": "User account exists",
  "post_conditions": "User is logged in",
  "tags": ["authentication", "login"],
  "assignee_id": 2,
  "assignee_name": "Jane Tester",
  "created_by": 1,
  "creator_name": "Admin User",
  "created_at": "2025-01-10T00:00:00Z",
  "steps": [
    {
      "id": 1,
      "step_number": 1,
      "description": "Navigate to login page",
      "expected_result": "Login form is displayed"
    },
    {
      "id": 2,
      "step_number": 2,
      "description": "Enter valid email and password",
      "expected_result": "Fields accept input"
    },
    {
      "id": 3,
      "step_number": 3,
      "description": "Click login button",
      "expected_result": "User is redirected to dashboard"
    }
  ],
  "executions": [
    {
      "id": 1,
      "status": "Pass",
      "executed_by": 2,
      "executor_name": "Jane Tester",
      "comments": "All steps passed",
      "executed_at": "2025-01-14T15:30:00Z"
    }
  ]
}
```

---

### Create Test Case

```http
POST /api/test-cases
```

**Authentication:** Required (admin or test-lead only)  
**Rate Limit:** 100 requests per hour

**Request Body:**
```json
{
  "projectId": 1,
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "string (required): Low, Medium, High, Critical",
  "type": "string (required): Functional, Integration, Regression, Smoke, UI, API",
  "preConditions": "string (optional)",
  "postConditions": "string (optional)",
  "tags": ["string array (optional)"],
  "assigneeId": "integer (optional)",
  "steps": [
    {
      "description": "string (required)",
      "expectedResult": "string (required)"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "id": 151,
  "project_id": 1,
  "title": "New Test Case",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### Update Test Case

```http
PUT /api/test-cases/:id
```

**Authentication:** Required (admin or test-lead only)  
**Rate Limit:** 100 requests per hour

**Request Body:** Same as Create Test Case (all fields optional)

---

### Delete Test Case

```http
DELETE /api/test-cases/:id
```

**Authentication:** Required (admin or test-lead only)  
**Rate Limit:** 100 requests per hour

---

### Bulk Operations

```http
POST /api/test-cases/bulk
```

**Authentication:** Required (admin or test-lead only)  
**Rate Limit:** 50 requests per hour

**Request Body:**
```json
{
  "ids": [1, 2, 3],
  "action": "delete" | "updatePriority" | "assignToSuite",
  "priority": "High (if action is updatePriority)",
  "suiteId": 5 (if action is assignToSuite)
}
```

**Success Response (200):**
```json
{
  "message": "Bulk operation completed",
  "updated": 3
}
```

---

## Test Execution Endpoints

### Create Execution

```http
POST /api/executions
```

**Authentication:** Required (admin, test-lead, or tester only)  
**Rate Limit:** 200 requests per hour

**Request Body:**
```json
{
  "testCaseId": 1,
  "status": "Pass | Fail | Blocked | Skipped",
  "comments": "string (optional)",
  "attachments": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "id": 100,
  "test_case_id": 1,
  "executed_by": 2,
  "status": "Pass",
  "comments": "Test completed successfully",
  "executed_at": "2025-01-15T10:00:00Z"
}
```

---

### List Executions

```http
GET /api/executions?projectId=1&status=Fail&page=1&limit=20
```

**Authentication:** Required  
**Rate Limit:** 200 requests per hour

**Query Parameters:**
- `projectId` (integer, required)
- `status` (string, optional)
- `testCaseId` (integer, optional)
- `executedBy` (integer, optional)
- `page` (integer, optional)
- `limit` (integer, optional)

---

## Defect Endpoints

### Create Defect

```http
POST /api/defects
```

**Authentication:** Required  
**Rate Limit:** 100 requests per hour

**Request Body:**
```json
{
  "testExecutionId": 100,
  "title": "string (required)",
  "description": "string (required)",
  "severity": "Low | Medium | High | Critical",
  "status": "Open | In Progress | Resolved | Closed"
}
```

---

### List Defects

```http
GET /api/defects?projectId=1&status=Open&severity=High
```

**Authentication:** Required  
**Rate Limit:** 100 requests per hour

---

## Analytics Endpoints

### Get Analytics

```http
GET /api/analytics?projectId=1
```

**Authentication:** Required  
**Rate Limit:** 50 requests per hour  
**Cache:** 15 minutes

**Success Response (200):**
```json
{
  "summary": {
    "total": 150,
    "passed": 120,
    "failed": 20,
    "blocked": 5,
    "pending": 5,
    "passRate": 80,
    "coverage": 95,
    "defectDensity": 0.13
  },
  "trends": [
    {
      "date": "2025-01-08",
      "passed": 15,
      "failed": 3,
      "total": 18
    }
  ],
  "priorityDistribution": [
    {
      "priority": "Critical",
      "count": 10,
      "passed": 8,
      "failed": 2
    }
  ],
  "typeDistribution": [...],
  "topPerformers": [
    {
      "name": "Jane Tester",
      "executed": 45,
      "passRate": 91
    }
  ]
}
```

---

## Error Responses

All endpoints may return these standard error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Rate limits are enforced per IP address:

| Endpoint Type | Limit |
|--------------|-------|
| Authentication | 5 requests / 15 minutes |
| CRUD Operations | 100 requests / hour |
| Test Execution | 200 requests / hour |
| Analytics | 50 requests / hour |
| Bulk Operations | 50 requests / hour |

When rate limited, the response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642253400
```

---

## Caching

Cached endpoints include cache control headers:

```
Cache-Control: public, max-age=600
X-Cache: HIT|MISS
```

Cache can be bypassed with:
```
Cache-Control: no-cache
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```
GET /api/test-cases?page=2&limit=50
```

**Response includes:**
```json
{
  "items": [...],
  "total": 150,
  "page": 2,
  "totalPages": 3,
  "hasNext": true,
  "hasPrev": true
}
```

---

## Filtering & Sorting

Most list endpoints support filtering:

```
GET /api/test-cases?priority=High&type=Functional&sort=created_at&order=desc
```

**Supported sort fields:**
- `created_at`
- `updated_at`
- `title`
- `priority`

**Sort order:**
- `asc` (ascending)
- `desc` (descending)
