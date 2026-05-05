# Backend Development Plan (MERN) — ProjectFlow

Last updated: 2026-04-27

## 1) Objective
Build a production-ready backend for ProjectFlow using the **MERN stack** to support the existing React frontend.

- **M**ongoDB: primary database
- **E**xpress: HTTP API framework
- **R**eact: existing frontend (already built)
- **N**ode.js: runtime for backend

The backend should replace current mock data and enable secure, role-based, persistent workflows.

---

## 2) Current Frontend Capabilities to Support
Based on current frontend behavior, backend must support:

1. Authentication (login, signup, session/token validation)
2. Role-based access (`student`, `team_lead`, `teacher`)
3. Project listing and details
4. Task management with status transitions (`todo`, `in_progress`, `done`)
5. Feedback submission/retrieval
6. Notifications
7. Profile/settings update

---

## 3) Proposed Backend Architecture

## 3.1 Tech choices
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT auth (access + refresh token strategy)
- `bcrypt` for password hashing
- `zod` or `joi` for request validation
- `helmet`, `cors`, `express-rate-limit` for security
- `pino`/`winston` for structured logging

## 3.2 Service layers
Use layered structure:
- **Routes**: request mapping
- **Controllers**: HTTP handlers
- **Services**: business logic
- **Models**: Mongoose schemas
- **Middlewares**: auth, RBAC, validation, error handling

## 3.3 Suggested folder structure

```text
backend/
  src/
    app.ts
    server.ts
    config/
      env.ts
      db.ts
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.routes.ts
        auth.validation.ts
      users/
      projects/
      tasks/
      feedback/
      notifications/
    middlewares/
      auth.middleware.ts
      rbac.middleware.ts
      validate.middleware.ts
      error.middleware.ts
    utils/
      apiError.ts
      apiResponse.ts
      logger.ts
    types/
      common.ts
  tests/
  package.json
  tsconfig.json
  .env.example
```

---

## 4) Data Model Plan (MongoDB)

## 4.1 Users
Fields:
- `_id`
- `name`
- `email` (unique)
- `passwordHash`
- `role` (`student` | `team_lead` | `teacher`)
- `avatarUrl` (optional)
- `teamId` (optional, ObjectId ref Team)
- timestamps

Indexes:
- unique index on `email`
- index on `role`

## 4.2 Teams (recommended)
Fields:
- `_id`
- `name`
- `members` (User refs)
- `leadId` (User ref)

## 4.3 Projects
Fields:
- `_id`
- `title`
- `description`
- `status` (`active` | `completed` | `on_hold`)
- `course`
- `deadline`
- `progress` (0-100)
- `teamId` (Team ref)
- `createdBy` (User ref)
- timestamps

Indexes:
- `teamId`, `status`, `deadline`

## 4.4 Tasks
Fields:
- `_id`
- `projectId` (Project ref)
- `title`
- `description`
- `status` (`todo` | `in_progress` | `done`)
- `priority` (`low` | `medium` | `high`)
- `assigneeId` (User ref)
- `deadline`
- timestamps

Indexes:
- `projectId`, `assigneeId`, `status`, `deadline`

## 4.5 Feedback
Fields:
- `_id`
- `projectId` (Project ref)
- `teacherId` (User ref)
- `rating` (1..5)
- `comments`
- `highlights` (string[])
- timestamps

Indexes:
- `projectId`, `teacherId`

## 4.6 Notifications
Fields:
- `_id`
- `userId` (User ref)
- `type` (`task` | `feedback` | `system` | `deadline`)
- `title`
- `message`
- `isRead`
- `readAt` (optional)
- timestamps

Indexes:
- `userId`, `isRead`, `createdAt`

---

## 5) API Contract Plan (v1)
Prefix: `/api/v1`

## 5.1 Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`

## 5.2 Users
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/:id` (restricted)

## 5.3 Projects
- `GET /projects` (role-filtered)
- `POST /projects` (team lead)
- `GET /projects/:id`
- `PATCH /projects/:id` (team lead/teacher with rules)
- `DELETE /projects/:id` (optional admin/owner)

## 5.4 Tasks
- `GET /projects/:projectId/tasks`
- `POST /projects/:projectId/tasks`
- `PATCH /tasks/:taskId`
- `PATCH /tasks/:taskId/status` (for kanban drag/drop)
- `DELETE /tasks/:taskId`

## 5.5 Feedback
- `GET /feedback` (teacher all, students scoped)
- `POST /feedback` (teacher only)
- `GET /projects/:projectId/feedback`

## 5.6 Notifications
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

---

## 6) Authorization Rules (RBAC)

## Roles
- `student`
- `team_lead`
- `teacher`

## Core rules
1. **Student**
   - can view only own-team projects
   - can update only assigned task status (or allowed project tasks if policy permits)
   - can view feedback for own-team projects

2. **Team Lead**
   - can create/update own-team projects
   - can create/assign/update tasks in own-team projects
   - can view team feedback

3. **Teacher**
   - can view all projects
   - can submit feedback
   - can view project/task progress globally

---

## 7) Security Plan
- Password hashing with bcrypt (min 10 rounds)
- Short-lived access JWT + refresh tokens
- Store refresh token securely (httpOnly cookie preferred)
- CORS allowlist for frontend origin(s)
- Input validation on all write endpoints
- Rate limiting on auth endpoints
- Helmet headers
- Centralized error handler with safe responses
- Audit log for sensitive actions (login, role-sensitive updates)

---

## 8) Development Phases

## Phase 1 — Foundation
- Initialize backend project
- Configure TypeScript, linting, formatting
- DB connection and env config
- Health endpoint: `GET /health`

Deliverable: bootable API server + Mongo connectivity.

## Phase 2 — Auth + User
- Implement signup/login/me/logout/refresh
- Add auth middleware and RBAC middleware
- User profile read/update

Deliverable: secure authentication and identity endpoints.

## Phase 3 — Projects + Tasks
- Projects CRUD with role scoping
- Tasks CRUD and status transition endpoint
- Progress calculation strategy (derived or persisted)

Deliverable: replace frontend mock project/task flows.

## Phase 4 — Feedback + Notifications
- Feedback create/list endpoints with teacher permissions
- Notification create/list/read/read-all
- Trigger notifications from task assignment and feedback submission

Deliverable: full role workflows complete.

## Phase 5 — Hardening + QA
- Pagination/filter/sort on list endpoints
- Tests (unit + integration)
- API docs (OpenAPI/Swagger)
- Production readiness checks

Deliverable: deployable backend v1.

---

## 9) Testing Strategy
- Unit tests for service logic
- Integration tests for API + DB behavior
- Auth/permission test matrix by role
- Contract tests for frontend-consumed responses

High-priority test cases:
1. Role-based project visibility
2. Task status update permissions
3. Teacher-only feedback creation
4. Refresh token lifecycle
5. Notification read-all behavior

---

## 10) Deployment Plan
- Environment separation: `dev`, `staging`, `prod`
- Use Docker for consistent runtime
- Host API (Render/Railway/AWS/GCP/Azure)
- Host MongoDB (MongoDB Atlas recommended)
- Configure secrets in platform env vars
- CI pipeline:
  1. install
  2. lint
  3. test
  4. build
  5. deploy

---

## 11) Environment Variables (.env.example)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

---

## 12) Frontend Integration Plan
1. Add API client layer in frontend (`src/lib/api/*`)
2. Replace `mockData.ts` usage incrementally module by module:
   - auth → projects/tasks → feedback → notifications
3. Introduce server-state library (React Query recommended)
4. Add loading/error/empty states aligned with API responses

---

## 13) Milestone Checklist
- [ ] Backend repo scaffolded
- [ ] DB connected + health endpoint
- [ ] Auth + RBAC complete
- [ ] Projects + tasks complete
- [ ] Feedback + notifications complete
- [ ] API docs published
- [ ] Test suite green
- [ ] Staging deployment complete
- [ ] Frontend switched from mocks to API

---

## 14) Suggested Execution Order (Fast Track)
Week 1: Foundation + Auth  
Week 2: Projects + Tasks  
Week 3: Feedback + Notifications + Integration  
Week 4: Testing + Hardening + Deployment

This sequence gets the React frontend off mock data quickly while keeping security and RBAC in place.
