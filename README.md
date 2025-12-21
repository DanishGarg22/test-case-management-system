# Test Case Management System

A comprehensive full-stack test case management application built with React, Next.js, PostgreSQL, and Redis.

## Features

### Core Functionality
- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Role-Based Access Control (RBAC)**: Support for 4 user roles (admin, test-lead, tester, read-only)
- **Project Management**: Create and manage multiple test projects
- **Test Case Management**: Full CRUD operations with search, filter, and bulk actions
- **Test Execution**: Execute tests, record results, and track history
- **Test Suites**: Organize test cases into logical suites
- **Defect Tracking**: Create and manage defects from failed tests
- **Analytics Dashboard**: Comprehensive metrics with interactive charts

### Performance Features
- **Redis Caching**: Configurable caching with automatic invalidation
- **Rate Limiting**: Per-endpoint rate limits to prevent abuse
- **Virtual Scrolling**: Handle large test case lists efficiently
- **Lazy Loading**: Code splitting for optimal load times
- **Pagination**: Server-side pagination for all list views

### Security Features
- **XSS Protection**: Input sanitization and validation
- **SQL Injection Prevention**: Parameterized queries
- **CSRF Protection**: Token-based authentication
- **Password Hashing**: bcrypt with salt rounds

## Tech Stack

- **Frontend**: React 18+ with Next.js 16
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL (Neon)
- **Caching**: Redis (Upstash)
- **Charts**: Recharts
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **Authentication**: JWT with bcrypt

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Neon account recommended)
- Redis instance (Upstash account recommended)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd test-case-management
pnpm install
```

### 2. Environment Variables

The following environment variables are already configured via Vercel integrations:

**Neon PostgreSQL:**
- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

**Upstash Redis:**
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

**JWT Secret (add manually):**
- `JWT_SECRET` - Generate a secure random string

### 3. Database Setup

Run the SQL scripts to create tables and seed data:

```bash
# The scripts are in the scripts/ folder:
# - 01-create-schema.sql (creates all tables)
# - 02-seed-data.sql (adds demo data)
```

You can execute these directly in the Neon SQL Editor or use the v0 interface to run them.

### 4. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## Demo Credentials

The seed script creates demo users for all roles:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Test Lead | lead@test.com | lead123 |
| Tester | tester@test.com | tester123 |
| Read-Only | viewer@test.com | viewer123 |

## User Roles & Permissions

### Admin
- Full access to all features
- User management
- Project creation and management
- Test case CRUD operations
- Test execution
- View all analytics and reports

### Test Lead
- Create/edit/delete test cases and suites
- Assign tests to team members
- Execute tests
- View project analytics and reports
- Cannot manage users or system settings

### Tester
- Execute assigned tests
- Update test results
- Create defects from failed tests
- View test cases and suites (read-only)
- Cannot create or edit test cases

### Read-Only
- View test cases and test results
- View analytics and dashboards
- Cannot execute tests or modify any data

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "tester"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "tester"
  },
  "token": "jwt-token-here"
}
```

#### POST /api/auth/login
Login with email and password.

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "tester"
  },
  "token": "jwt-token-here"
}
```

#### GET /api/auth/me
Get current user details (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "tester"
}
```

### Project Endpoints

#### GET /api/projects
Get all projects (paginated, cached for 1 hour).

**Rate Limit:** 100 requests per hour

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "projects": [...],
  "total": 10,
  "page": 1,
  "totalPages": 1
}
```

#### POST /api/projects
Create a new project (admin/test-lead only).

**Rate Limit:** 100 requests per hour

**Request Body:**
```json
{
  "name": "E-commerce Platform",
  "description": "Test project for e-commerce",
  "version": "1.0.0",
  "status": "active"
}
```

### Test Case Endpoints

#### GET /api/test-cases
Get all test cases with filters (cached for 10 minutes).

**Rate Limit:** 100 requests per hour

**Query Parameters:**
- `projectId`: Project ID (required)
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `priority`: Filter by priority (Low, Medium, High, Critical)
- `type`: Filter by type (Functional, Integration, etc.)
- `assigneeId`: Filter by assignee

#### POST /api/test-cases
Create a test case (admin/test-lead only).

**Rate Limit:** 100 requests per hour

#### POST /api/test-cases/bulk
Bulk operations on test cases (admin/test-lead only).

**Rate Limit:** 50 requests per hour

**Request Body:**
```json
{
  "ids": [1, 2, 3],
  "action": "delete" | "updatePriority" | "assignToSuite",
  "priority": "High",
  "suiteId": 5
}
```

### Test Execution Endpoints

#### POST /api/executions
Create a test execution (admin/test-lead/tester only).

**Rate Limit:** 200 requests per hour

**Request Body:**
```json
{
  "testCaseId": 1,
  "status": "Pass" | "Fail" | "Blocked" | "Skipped",
  "comments": "Test completed successfully",
  "executedBy": 2
}
```

### Analytics Endpoints

#### GET /api/analytics
Get analytics data (cached for 15 minutes).

**Rate Limit:** 50 requests per hour

**Query Parameters:**
- `projectId`: Project ID (required)

**Response:**
```json
{
  "summary": {
    "total": 100,
    "passed": 75,
    "failed": 15,
    "blocked": 5,
    "pending": 5,
    "passRate": 75,
    "coverage": 95
  },
  "trends": [...],
  "priorityDistribution": [...],
  "defectDensity": 0.15
}
```

## Database Schema

### Users Table
- `id`: Primary key
- `name`: User full name
- `email`: Unique email address
- `password`: Hashed password (bcrypt)
- `role`: User role (admin, test-lead, tester, read-only)
- `created_at`: Timestamp

### Projects Table
- `id`: Primary key
- `name`: Project name
- `description`: Project description
- `version`: Version number
- `status`: Project status (active, archived)
- `created_by`: Foreign key to users
- `created_at`: Timestamp

### Test_Cases Table
- `id`: Primary key
- `project_id`: Foreign key to projects
- `title`: Test case title
- `description`: Detailed description
- `priority`: Priority level
- `type`: Test type
- `pre_conditions`: Pre-conditions
- `post_conditions`: Post-conditions
- `tags`: Tags for categorization
- `assignee_id`: Foreign key to users
- `created_by`: Foreign key to users
- `created_at`: Timestamp

### Test_Steps Table
- `id`: Primary key
- `test_case_id`: Foreign key to test_cases
- `step_number`: Order of step
- `description`: Step description
- `expected_result`: Expected outcome

### Test_Executions Table
- `id`: Primary key
- `test_case_id`: Foreign key to test_cases
- `executed_by`: Foreign key to users
- `status`: Execution status
- `comments`: Execution notes
- `executed_at`: Timestamp

### Test_Suites Table
- `id`: Primary key
- `project_id`: Foreign key to projects
- `name`: Suite name
- `description`: Suite description

### Defects Table
- `id`: Primary key
- `test_execution_id`: Foreign key to test_executions
- `title`: Defect title
- `description`: Defect description
- `severity`: Severity level
- `status`: Defect status
- `reported_by`: Foreign key to users

## Caching Strategy

The application uses Redis for caching with the following TTLs:

- **Project Lists**: 1 hour (invalidated on create/update/delete)
- **Test Suite Lists**: 30 minutes (invalidated on modifications)
- **Test Case Lists**: 10 minutes (invalidated on CRUD operations)
- **Analytics Data**: 15 minutes (invalidated on test execution)

## Rate Limiting

Rate limits are enforced per IP address:

- **Auth Endpoints**: 5 requests per 15 minutes
- **CRUD Endpoints**: 100 requests per hour
- **Execution Endpoints**: 200 requests per hour
- **Analytics Endpoints**: 50 requests per hour
- **Bulk Operations**: 50 requests per hour

## Performance Optimizations

### Frontend
- **React.lazy()**: Route-based code splitting
- **React.memo**: Memoized components to prevent re-renders
- **useMemo**: Expensive calculations (analytics, filtered lists)
- **useCallback**: Optimized event handlers
- **Virtual Scrolling**: For large test case lists (1000+ items)
- **Pagination**: Server-side pagination for all list views

### Backend
- **Redis Caching**: Frequently accessed data cached
- **Database Indexes**: On foreign keys and frequently queried fields
- **Connection Pooling**: Efficient database connections
- **Parameterized Queries**: Prevents SQL injection and improves query planning

## Security Best Practices

1. **Authentication**: JWT tokens with 24-hour expiration
2. **Password Security**: bcrypt hashing with 10 salt rounds
3. **Input Validation**: All inputs sanitized and validated
4. **XSS Prevention**: HTML escaping and Content Security Policy
5. **SQL Injection Prevention**: Parameterized queries only
6. **Rate Limiting**: Per-endpoint limits to prevent abuse
7. **CORS**: Configured for production domains
8. **HTTPS**: Required in production

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Connect Neon and Upstash integrations
4. Add `JWT_SECRET` environment variable
5. Run database migrations
6. Deploy

### Environment Variables in Production

Ensure all environment variables are set in Vercel:
- Database credentials from Neon
- Redis credentials from Upstash
- `JWT_SECRET` (generate a secure random string)

## Development Workflow

1. Create a feature branch
2. Make changes and test locally
3. Run the app with `pnpm dev`
4. Commit with clear messages
5. Push and create a pull request
6. Deploy after review

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` environment variable
- Check Neon dashboard for database status
- Ensure IP allowlist is configured (if enabled)

### Redis Connection Issues
- Verify Upstash credentials
- Check Redis dashboard for service status
- Ensure rate limiting is not blocking requests

### Authentication Issues
- Verify `JWT_SECRET` is set
- Check token expiration (24 hours)
- Clear browser cookies and login again

## Future Enhancements

- CSV/Excel import/export for test cases
- Email notifications for assignments
- Test case versioning
- CI/CD pipeline integration
- Scheduled test runs
- Real-time collaboration features
- Mobile app support
