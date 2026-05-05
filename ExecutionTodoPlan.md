# Execution TODO Plan — ProjectFlow Backend (MERN)

Last updated: 2026-04-27

Purpose: Execute backend work in strict sequence. For each item: **Develop → Test → Mark Done → Start Next**.

---

## Workflow Rules (applies to every task)
1. Move one task to `IN PROGRESS`.
2. Implement only that scope.
3. Run tests for that scope (plus regression sanity).
4. If tests pass and acceptance criteria are met, mark `DONE`.
5. Then move to the next task.

Status legend:
- `TODO`
- `IN PROGRESS`
- `DONE`

---

## Master TODO Queue

### 1) Backend scaffold and standards
- Status: `TODO`
- Develop:
  - Create `backend/` Node + Express + TypeScript app.
  - Add lint/format scripts and base folder structure.
  - Add `GET /health` endpoint.
- Test:
  - App starts locally.
  - `GET /health` returns 200.
- Done criteria:
  - Base project boots cleanly and passes lint.

### 2) Environment and DB connectivity
- Status: `TODO`
- Develop:
  - Add env loader/validation.
  - Add MongoDB connection module with startup checks.
  - Add `.env.example`.
- Test:
  - App fails fast on missing env.
  - App connects successfully with valid Mongo URI.
- Done criteria:
  - Stable boot with validated config and DB connection.

### 3) Auth module (signup/login/me/logout/refresh)
- Status: `TODO`
- Develop:
  - User auth flows with password hashing and JWT strategy.
  - Auth middleware for protected routes.
- Test:
  - Unit tests for token/password helpers.
  - Integration tests for all auth endpoints.
- Done criteria:
  - Auth endpoints functional and secured.

### 4) RBAC middleware and permission matrix
- Status: `TODO`
- Develop:
  - Implement role guard middleware (`student`, `team_lead`, `teacher`).
  - Add reusable permission utilities.
- Test:
  - Forbidden/allowed access tests per role.
- Done criteria:
  - Routes enforce expected role policies.

### 5) User profile module
- Status: `TODO`
- Develop:
  - `GET /users/me`, `PATCH /users/me`, restricted `GET /users/:id`.
- Test:
  - Profile fetch/update integration tests.
  - Validation tests for bad payloads.
- Done criteria:
  - User profile APIs stable and validated.

### 6) Projects module
- Status: `TODO`
- Develop:
  - CRUD (as per plan), role-scoped project listing.
  - Team-based visibility logic.
- Test:
  - Filtering/scope tests by role and team.
  - CRUD positive/negative cases.
- Done criteria:
  - Project APIs match frontend needs and RBAC rules.

### 7) Tasks module + kanban status transitions
- Status: `TODO`
- Develop:
  - Task CRUD endpoints.
  - `PATCH /tasks/:taskId/status` for drag/drop updates.
- Test:
  - Transition validity tests.
  - Permission tests for assignee/team lead rules.
- Done criteria:
  - Task flows support project board behavior.

### 8) Feedback module
- Status: `TODO`
- Develop:
  - Teacher-only feedback creation.
  - Feedback listing scoped by role/team/project.
- Test:
  - Teacher-only create tests.
  - Student/team lead read-scope tests.
- Done criteria:
  - Feedback APIs implement current frontend behavior.

### 9) Notifications module
- Status: `TODO`
- Develop:
  - List notifications, mark one read, mark all read.
  - Trigger notifications from key actions (task assign, feedback submit).
- Test:
  - Read state transition tests.
  - Trigger generation tests.
- Done criteria:
  - Notification APIs complete and reliable.

### 10) API hardening and cross-cutting middleware
- Status: `TODO`
- Develop:
  - Validation middleware, centralized error handler, security middleware.
  - Pagination/filter/sort support where needed.
- Test:
  - Error-shape tests, invalid input tests, security sanity tests.
- Done criteria:
  - Consistent API responses and hardened middleware pipeline.

### 11) Test suite completion and coverage gate
- Status: `TODO`
- Develop:
  - Complete unit + integration test coverage for critical paths.
  - Add CI test commands.
- Test:
  - Full suite green locally and in CI.
- Done criteria:
  - Agreed quality gate reached.

### 12) API documentation and frontend integration pass
- Status: `TODO`
- Develop:
  - Publish OpenAPI/Swagger docs.
  - Integrate frontend incrementally (auth → projects/tasks → feedback → notifications).
- Test:
  - Frontend smoke tests against backend endpoints.
- Done criteria:
  - Frontend no longer depends on mock data for integrated modules.

### 13) Staging deployment and release readiness
- Status: `TODO`
- Develop:
  - Dockerize backend.
  - Staging deploy with environment secrets and DB.
- Test:
  - Staging smoke + auth/RBAC regression tests.
- Done criteria:
  - Staging verified and release-ready checklist signed off.

---

## Execution Log (update during implementation)
- Current task: `1) Backend scaffold and standards`
- Last completed task: `None`
- Blockers: `None`

When a task is finished, update:
1. Task status to `DONE`
2. `Last completed task`
3. `Current task` to the next TODO
