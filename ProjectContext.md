# ProjectFlow — Project Context

Last updated: 2026-04-27

## 1) Project summary
ProjectFlow is a role-based academic project management frontend app built with React + Vite.
It supports three user roles (`student`, `team_lead`, `teacher`) with role-specific dashboards and workflows around:
- project tracking,
- task status management,
- teacher feedback.

The app currently runs on mock/in-memory data and local browser storage (no backend API integration yet).

---

## 2) Tech stack and runtime

### Core
- React 18
- React Router v7 (`react-router`)
- Vite 6
- TypeScript (TS/TSX files)

### UI and styling
- Tailwind CSS (via `@tailwindcss/vite`)
- Utility composition with `clsx` + `tailwind-merge`
- Lucide icons (`lucide-react`)
- Recharts for charts
- React DnD for kanban drag/drop
- Radix + shadcn-like component files exist under `src/app/components/ui/` (large component set)

### Data and auth
- Mock data source in `src/lib/mockData.ts`
- Mock auth context in `src/context/AuthContext.tsx`
- Login state persisted via `localStorage` key: `auth_user_id`

---

## 3) Entry points and app composition

- `src/main.tsx` bootstraps React and loads global styles.
- `src/app/App.tsx` wraps router with `AuthProvider`.
- `src/routes.tsx` defines public routes (`/login`, `/signup`, `/forgot-password`) and app shell routes under `/`.

Routing under authenticated shell (`Layout`):
- `/dashboard`
- `/projects`
- `/projects/create`
- `/projects/:id`
- `/feedback`
- `/profile`

Note: auth guarding is implemented in `Layout` by checking `user` from context and redirecting to `/login` if missing.

---

## 4) Roles and behavior model

## Roles
Defined in `mockData.ts`:
- `student`
- `team_lead`
- `teacher`

### Dashboard switching
`src/pages/Dashboard.tsx` renders:
- `StudentDashboard` for students
- `TeamLeadDashboard` for team leads
- `TeacherDashboard` for teachers

### Page-level role behaviors
- `Projects`:
  - teacher sees all projects
  - student/team lead see only their team projects
- `CreateProject`:
  - intended for team leads (UI entry point shown for team lead role)
- `Feedback`:
  - teacher: submit feedback form
  - student/team lead: view existing feedback for own projects
- `ProjectDetails`:
  - teacher sees "Add Feedback" action
  - all roles can view board (current mock behavior)

---

## 5) Key domain types and data contracts

From `src/lib/mockData.ts`:
- `User`: id, name, email, role, avatar, optional teamId
- `Project`: id, title, description, status (`active|completed|on_hold`), teamId, course, deadline, progress
- `Task`: id, projectId, title, description, status (`todo|in_progress|done`), assigneeId, deadline, priority (`low|medium|high`)
- `Feedback`: projectId, teacherId, rating, comments, date, highlights[]
- `Notification`: userId + title/message/read/type/date

All pages read from exported arrays:
- `MOCK_USERS`
- `MOCK_PROJECTS`
- `MOCK_TASKS`
- `MOCK_FEEDBACK`
- `MOCK_NOTIFICATIONS`

Important current limitation: data writes are mostly local component state only (not persisted globally).

---

## 6) UI architecture

Two UI layers are present:

1) **Actively used custom wrappers** in `src/components/ui.tsx`
   - exports `Card`, `Button`, `Input`, `Badge`, `cn`, etc.
   - most page/dashboard files import from this module.

2) **Large reusable UI kit** in `src/app/components/ui/`
   - many Radix-based primitives exist but are mostly not directly imported in page files yet.

This suggests the project can gradually migrate/standardize to one UI layer later.

---

## 7) Feature map by file

### Auth and shell
- `src/context/AuthContext.tsx` — login/logout mock state and localStorage persistence.
- `src/components/Layout.tsx` — sidebar, header, notifications dropdown, outlet shell.

### Main pages
- `src/pages/Login.tsx` — demo role/email login.
- `src/pages/Signup.tsx` — placeholder signup form.
- `src/pages/Dashboard.tsx` — role-based dashboard router component.
- `src/pages/Projects.tsx` — searchable/filterable project cards.
- `src/pages/CreateProject.tsx` — create form (currently mock submit only).
- `src/pages/ProjectDetails.tsx` — project overview + kanban board with drag/drop task status changes.
- `src/pages/Feedback.tsx` — teacher feedback submit + student feedback review.
- `src/pages/Settings.tsx` — profile/settings UI with mock save state.

### Dashboard components
- `src/components/dashboards/StudentDashboard.tsx`
- `src/components/dashboards/TeamLeadDashboard.tsx` (charts + project creation CTA)
- `src/components/dashboards/TeacherDashboard.tsx`

---

## 8) Current implementation constraints / gaps

1. No backend/API integration.
2. No route-level RBAC guards beyond UI visibility patterns.
3. Some actions are placeholders:
   - create project submit
   - feedback submission persistence
   - "mark all read" notifications
   - add task button on project details
4. `Layout` uses `window.location.pathname` directly for heading text (can be improved with router state).
5. Data ownership is split between static mocks and local component state; no centralized server state layer.

---

## 9) Recommended next-step architecture (for future improvements)

When implementing upcoming features, prefer this sequence:

1. **Introduce data layer**
   - add API client module (`src/lib/api/*`) and replace direct mock array reads.
   - keep mock adapters for local/demo mode.

2. **Add route protection + RBAC**
   - create reusable auth/role guards for router.
   - protect `projects/create`, teacher feedback actions, etc.

3. **Introduce shared state/query layer**
   - adopt React Query or equivalent for server state.
   - standardize mutations for tasks/projects/feedback.

4. **Normalize UI system usage**
   - choose whether to keep `src/components/ui.tsx` wrappers or move fully to `src/app/components/ui/*`.

5. **Persisted task/project updates**
   - make kanban moves update backend and refetch.

---

## 10) Coding conventions observed

- Functional React components with hooks.
- Role checks are inline and explicit.
- Tailwind-first styling with rounded card-heavy visual language.
- `Link`/`NavLink` for navigation; `useNavigate()` for imperative redirects.
- Type contracts are currently centralized in `mockData.ts`.

---

## 11) Quick reference for future feature work

If adding a new feature, start by checking:
1. Route registration in `src/routes.tsx`
2. Role visibility in `src/components/Layout.tsx` and target page
3. Data model updates in `src/lib/mockData.ts` (or future API models)
4. Shared UI primitive availability in `src/components/ui.tsx` or `src/app/components/ui/*`
5. Dashboard impacts by role components under `src/components/dashboards/`

---

## 12) Maintenance note

This file is intended as the working project memory. Update it whenever any of these change:
- routing structure,
- auth/role behavior,
- domain models,
- state management strategy,
- key dependencies,
- page ownership.
