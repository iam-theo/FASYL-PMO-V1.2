# Functional Requirements Document (FRD)

## FASYL PMO — Project Management Office Portal

| | |
|---|---|
| **Document version** | 1.0 |
| **Product** | FASYL PMO Portal (fasylpmo.sflbk.com) |
| **Document status** | Draft for review |
| **Audience** | Product, Engineering, QA, Stakeholders |
| **System type** | Web application (React SPA + Node.js/Express REST API + PostgreSQL/Neon + WebSocket) |

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional requirements for the FASYL PMO Portal, a project management office tool that lets FASYL track customer projects imported from the Sales system, run them through a stage-gated workflow, manage resources and tasks, generate reports, and keep users informed via reminders, notifications, and real-time updates.

### 1.2 Scope
In scope:

- User authentication, authorization and account creation.
- Project portfolio view and drill-down workspace.
- Stage-based project workflow (submit / approve / reject) with checklists and document uploads.
- Task management and assignment to project resources.
- Manual addition of project resources.
- Report generation and management.
- Reminders and in-app notifications.
- Real-time project updates over WebSocket.
- Public API documentation (Swagger).

Out of scope:

- Billing, invoicing, payroll or financial workflows.
- Sales pipeline management (projects are sourced from the external Sales system).
- Mobile applications (portal is a responsive web app).
- Integration with external email/notification providers (implementation-specific).

### 1.3 Product Overview
Sales projects are synchronized automatically into the PMO. The **Head of Operations** assigns a **Project Manager** to each project. The Project Manager manages project stages, checklists, documents, resources, tasks and reports. **Staff** members, mapped to project resources, view and update their own tasks. The workflow enforces stage order: a stage must be submitted, then approved or rejected before the project can progress.

---

## 2. Users and Roles

### 2.1 User Roles

| Role | Code | Description |
|---|---|---|
| Head of Operations | `HEADOFOPS` | Oversees all projects; assigns Project Managers; updates/deletes projects; approves workflow stages; reads reports; cannot modify tasks. |
| Project Manager | `PROJECTMANAGER` | Manages stages, checklists, documents, resources, tasks and reports for assigned projects. |
| Staff | `STAFF` | Sees projects/tasks mapped to them; may update the status of their own tasks only. |

### 2.2 Role-Based Access Matrix (summary)

| Capability | HEADOFOPS | PROJECTMANAGER | STAFF |
|---|---|---|---|
| Login / refresh / logout | ✓ | ✓ | ✓ |
| View projects & workspace | ✓ | ✓ | ✓ (own only) |
| Assign Project Manager | ✓ | – | – |
| Create / update / delete project | ✓ | – | – |
| Add resource to project | ✓ | ✓ | – |
| Update stage checklist | – | ✓ | – |
| Upload / delete stage documents | – | ✓ | – |
| Submit stage for approval | – | ✓ | – |
| Approve / reject stage | ✓ | – | – |
| Create / delete task | – | ✓ | – |
| Update task | – | ✓ | ✓ (own task status) |
| View / manage reports | ✓ | ✓ | – |
| Use reminders & notifications | ✓ | ✓ | ✓ |

---

## 3. Functional Requirements

Requirement IDs: `FR-<MODULE>-<NN>`. Priority: **M** = Must, **S** = Should, **C** = Could.

### 3.1 Authentication and User Management

| ID | Priority | Requirement |
|---|---|---|
| FR-AUTH-01 | M | The system shall provide login with email and password. |
| FR-AUTH-02 | M | On successful login, the system shall return a JWT **access token** and issue a **refresh token** persisted in the `RefreshToken` table and delivered via an HTTP-only cookie. |
| FR-AUTH-03 | M | The system shall provide a token **refresh** endpoint that issues a new access token from a valid refresh token. |
| FR-AUTH-04 | M | The system shall provide a **logout** endpoint that invalidates the session/refresh token. |
| FR-AUTH-05 | M | The system shall enforce login throttling (rate limiting and slowdown) to prevent brute-force attempts. |
| FR-AUTH-06 | M | The system shall support registering a new user via the standard registration endpoint with `fullName`, `email`, `password` and optional `role`. |
| FR-AUTH-07 | M | The system shall support **OTP-based self-signup** for `PROJECTMANAGER` and `STAFF` accounts only: a 6-digit code is emailed and must be verified within 10 minutes before the account is created. `HEADOFOPS` shall be rejected by this flow. |
| FR-AUTH-08 | M | The system shall reject duplicate emails during signup/registration. |
| FR-AUTH-09 | M | The system shall expose an endpoint listing all `PROJECTMANAGER` users for assignment dropdowns. |
| FR-AUTH-10 | M | Protected endpoints shall require a valid bearer access token; missing, malformed or expired tokens shall return 401. |
| FR-AUTH-11 | S | Passwords shall be stored hashed (bcrypt); plaintext passwords must never be logged or returned. |

### 3.2 Dashboard and Navigation

| ID | Priority | Requirement |
|---|---|---|
| FR-NAV-01 | M | The application shall provide a sidebar with **Dashboard**, **Projects** and **Reports** (Reports only for HEADOFOPS/PROJECTMANAGER). |
| FR-NAV-02 | M | The application shall display the logged-in user's identity and provide a logout action in the top bar. |
| FR-NAV-03 | M | The sidebar collapse state shall persist across sessions. |
| FR-NAV-04 | S | The top bar shall surface notifications with an unread count and mark-as-read actions. |

### 3.3 Projects

| ID | Priority | Requirement |
|---|---|---|
| FR-PRJ-01 | M | Projects shall be **sourced automatically** from the Sales system on a scheduled (≈every minute) sync job; each project carries a unique string `projectId` (e.g. `PROJ-731443`) and a numeric database `id`. |
| FR-PRJ-02 | M | The system shall list projects with role-based scoping: HEADOFOPS sees all; Project Managers see their assigned projects; Staff see projects in which they are a resource. |
| FR-PRJ-03 | M | The system shall allow retrieval of a single project by its string `projectId`. |
| FR-PRJ-04 | M | HEADOFOPS shall be able to update project details (name, client, product, etc.). |
| FR-PRJ-05 | M | HEADOFOPS shall be able to delete a project. |
| FR-PRJ-06 | M | HEADOFOPS shall be able to **assign a Project Manager** to a project by email. |
| FR-PRJ-07 | M | Upon assignment, the Project Manager shall be notified by email (delivered via configured SMTP relay). |
| FR-PRJ-08 | M | Each project shall expose `status`, `workflowStatus` (UNASSIGNED → LOCKED → OPEN → SUBMITTED → APPROVED/REJECTED → COMPLETED) and `currentStageOrder`. |
| FR-PRJ-09 | M | A project with **no resources** shall show an onboarding/empty state prompting setup. |
| FR-PRJ-10 | S | Project updates (including resource changes) shall be broadcast in real time so open workspaces refresh automatically. |

### 3.4 Project Workspace and Workflow

The workspace presents sub-tabs: **Overview, Resources, Tasks, Calendar, Reports, Project Lifecycle**.

| ID | Priority | Requirement |
|---|---|---|
| FR-WF-01 | M | Each project shall have an ordered list of stages (`stageOrder`, `stageName`, `stageKey`). |
| FR-WF-02 | M | A stage shall only be **submitted** when it is the project's `currentStageOrder` (stage sequencing enforced). |
| FR-WF-03 | M | The Project Manager shall be able to **submit** a stage for approval. |
| FR-WF-04 | M | HEADOFOPS shall be able to **approve** or **reject** a submitted stage; rejection shall require a `reason`. |
| FR-WF-05 | M | Approving a stage shall advance the project to the next stage order. |
| FR-WF-06 | M | The system shall track per-stage workflow state and timestamps (submitted/approved/rejected by/at). |
| FR-WF-07 | M | Each stage shall have a **checklist**; the Project Manager shall be able to update checklist item completion. |
| FR-WF-08 | M | The Project Manager shall be able to **upload** stage documents (max 5 MB, type-validated) and **delete** them; uploaded files shall be served from the `/uploads` path with publicly accessible URLs. |
| FR-WF-09 | S | Stage documents shall be persisted per required-document key (`docKey`). |
| FR-WF-10 | S | The workspace shall expose workflow state per stage for HEADOFOPS to review and act on. |

### 3.5 Resources

| ID | Priority | Requirement |
|---|---|---|
| FR-RES-01 | M | Each project shall maintain a `resources` list (from Sales sync) containing at least `recordId`, `firstName`, `lastName`, `email`, `staffId`, `phoneNumber`, optional `designation`. |
| FR-RES-02 | M | The workspace shall display project resources with pagination (6 per page) and CSV/Excel/PDF export. |
| FR-RES-03 | M | HEADOFOPS and PROJECTMANAGER shall be able to **add a resource manually** (first name and last name required; email, phone, staff ID, designation optional) when a resource is not yet listed. |
| FR-RES-04 | M | A resource with a `recordId` absent shall be assigned a generated `MAN-<timestamp>` record ID. |
| FR-RES-05 | M | Adding a duplicate resource (same email, staffId or recordId) on a project shall be rejected with a clear error. |
| FR-RES-06 | M | After adding a resource, the workspace shall reload the latest project data so the resource list is immediately current. |
| FR-RES-07 | S | Staff shall be identified as resources by matching their email to a resource email within a project. |

### 3.6 Tasks

| ID | Priority | Requirement |
|---|---|---|
| FR-TSK-01 | M | PROJECTMANAGER shall be able to **create a task** on a project (and optionally a stage), providing `title` (required), `description`, `priority` (LOW/MEDIUM/HIGH/URGENT, default MEDIUM), `startDate`, `dueDate`, and an `assignedResourceId` referencing a resource in the project. |
| FR-TSK-02 | M | Task creation shall require a valid project resource for the assignment; unlisted resources shall be rejected. |
| FR-TSK-03 | M | The system shall fetch tasks for a project stage (`GET /tasks/project/{projectId}/stage/{stageOrder}`). |
| FR-TSK-04 | M | The system shall return the count of tasks assigned to the current user (`GET /tasks/my-count`). |
| FR-TSK-05 | M | The system shall allow retrieval of a single task by id. |
| FR-TSK-06 | M | PROJECTMANAGER shall be able to **update** task details. |
| FR-TSK-07 | M | STAFF shall be able to **update the status of tasks assigned to them only**. |
| FR-TSK-08 | M | HEADOFOPS shall be **blocked** from updating tasks. |
| FR-TSK-09 | M | PROJECTMANAGER shall be able to **delete** a task. |
| FR-TSK-10 | S | Task assignment changes shall trigger email/reminder notifications (fire-and-forget so task creation is not slowed by email delivery). |
| FR-TSK-11 | S | Task statuses shall include TODO, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE, CANCELLED. |

### 3.7 Reports

| ID | Priority | Requirement |
|---|---|---|
| FR-RPT-01 | M | HEADOFOPS and PROJECTMANAGER shall be able to **generate** a report for a project (type, format, title, period, content/file). |
| FR-RPT-02 | M | The system shall list all reports visible to the caller (role-scoped). |
| FR-RPT-03 | M | The system shall allow retrieval of a single report by id. |
| FR-RPT-04 | M | The system shall allow **update** of report metadata/content and **delete** of reports. |
| FR-RPT-05 | S | Reports shall support multiple types (e.g. PROJECT, STAGE, PROGRESS, WEEKLY, MONTHLY, FINANCIAL, RESOURCE, RISK, STATUS, CLOSURE, CUSTOM) and statuses (DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → REJECTED, ARCHIVED). |
| FR-RPT-06 | S | The reports module shall be a self-contained lazy-loaded area with its own client, caching, filters and export/share capabilities. |

### 3.8 Reminders

| ID | Priority | Requirement |
|---|---|---|
| FR-RMD-01 | M | The system shall create reminders for tasks (e.g. task-due reminders a configurable number of days before the due date). |
| FR-RMD-02 | M | Authenticated users shall be able to view their own reminders (`GET /reminders/my`). |
| FR-RMD-03 | M | The system shall support reminder lifecycle actions: **complete**, **dismiss**, **cancel**, **delete**. |
| FR-RMD-04 | M | The system shall support updating a reminder (title, message, type, status, remindAt). |
| FR-RMD-05 | M | A scheduler shall evaluate pending reminders and send them at the configured `remindAt`. |
| FR-RMD-06 | S | Reminder types: GENERAL, TASK_DUE, PROJECT_DUE, STAGE_DUE, APPROVAL, REVIEW, MEETING, FOLLOW_UP; statuses: PENDING, SENT, DISMISSED, COMPLETED, CANCELLED. |
| FR-RMD-07 | C | Admin endpoints may list all reminders or those of a specific user. |

### 3.9 Notifications

| ID | Priority | Requirement |
|---|---|---|
| FR-NOT-01 | M | The system shall record in-app notifications for the current user (`userId`, `projectId`, `type`, `title`, `message`, `data`, `readAt`, `createdAt`). |
| FR-NOT-02 | M | The user shall be able to fetch their notifications (newest first, up to 100) along with the unread count. |
| FR-NOT-03 | M | The user shall be able to mark a single notification as read and mark all as read. |
| FR-NOT-04 | M | Notifications shall be limited to the calling user (a user cannot read another user's notification). |
| FR-NOT-05 | S | Project assignment and task events shall generate notifications to the relevant users. |

### 3.10 Real-Time Updates

| ID | Priority | Requirement |
|---|---|---|
| FR-RT-01 | M | The frontend shall open a WebSocket connection authenticated with the user's JWT. |
| FR-RT-02 | M | The server shall broadcast `data:changed` events (tagged with the affected module) so that project lists, open workspaces, audit trails and reminders refresh automatically without a manual reload. |
| FR-RT-03 | M | The client shall automatically re-fetch data on such events. |

### 3.11 API Documentation

| ID | Priority | Requirement |
|---|---|---|
| FR-API-01 | M | Every REST endpoint shall be annotated with Swagger/OpenAPI documentation served at `/docs`. |
| FR-API-02 | M | The documentation shall reflect the actual current routes (verified against route registration). |
| FR-API-03 | S | The `/docs` assets shall not be cached so documentation always reflects the latest deployment. |
| FR-API-04 | M | The API shall be exposed under `/api/v1/*` with legacy `/api/*` aliases. |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Task creation and other write operations shall not be delayed by external email delivery (notification calls are fire-and-forget). |
| NFR-02 | Performance | The sales-sync job (≈1-minute interval) must not block API responses; failures (e.g. unreachable Sales API) shall be logged without taking down the server. |
| NFR-03 | Security | All API responses must be authenticated via JWT where required; role-based access control must be enforced server-side on every guarded route. |
| NFR-04 | Security | Secrets (JWT secret, database URL, SMTP credentials) shall live in environment configuration, never in source control. |
| NFR-05 | Security | File uploads shall be size-limited (5 MB) and type-validated. |
| NFR-06 | Reliability | The server must auto-restart on failure (PM2) and reload on backend changes in deployed environments. |
| NFR-07 | Availability | Graceful shutdown on SIGINT/SIGTERM closing the HTTP server and Prisma connections. |
| NFR-08 | Compatibility | The frontend must be responsive and usable on desktop and mobile widths. |
| NFR-09 | Observability | The system shall log requests, errors and background job activity for troubleshooting. |
| NFR-10 | Auditability | Key state changes (project, workflow, tasks) shall be tracked with timestamps and acting user where the model supports it. |

---

## 5. Business Rules

- **BR-01** A project cannot be submitted for a stage unless that stage is the project's current stage order.
- **BR-02** A stage rejection must include a reason.
- **BR-03** Duplicate resources on a project (by email, staff ID, or record ID) are not allowed.
- **BR-04** Staff may only act on tasks assigned to their own resource record.
- **BR-05** HEADOFOPS is read-only with respect to tasks.
- **BR-06** Only HEADOFOPS may assign Project Managers.
- **BR-07** OTP self-signup may create PROJECTMANAGER and STAFF accounts only.
- **BR-08** A project with no assigned Project Manager prompts assignment before full workspace access.
- **BR-09** Project resource lists are the source of truth for task assignment eligibility.

---

## 6. Data Requirements

| Entity | Key fields |
|---|---|
| User | id, fullName, email (unique), password (hash), role |
| RefreshToken | id, token (unique), userId, expiresAt |
| Project | id (numeric), projectId (string, unique), projectName, clientName, productName, status, workflowStatus, currentStageOrder, resources (JSON), projectManagerId, dueDate, startDate, endDate, milestones (JSON) |
| ProjectStage | id, projectId (string FK), stageOrder, stageName, stageKey, workflowStatus, checklist (JSON), requiredDocs (JSON), submittedBy/approvedBy/rejectedBy, timestamps |
| ProjectApproval | id, projectId, stage, status, approvedBy, comment, timestamps |
| Task | id, title, description, status, priority, startDate, dueDate, projectId (numeric FK), stageId, assignedResourceId, assignedToUserId, assignedById, createdById |
| Report | id, projectId, stageId, title, type, status, format, content (JSON), fileUrl, fileName, periodStart, periodEnd |
| Reminder | id, userId, projectId, taskId, stageId, title, message, type, status, remindAt, sentAt, dismissedAt, completedAt |
| Notification | id, userId, projectId, type, title, message, data (JSON), readAt, createdAt |
| ProjectTimeline / Escalation / AuditLog | history, escalation and audit records keyed to project |

---

## 7. Assumptions and Dependencies

- The external Sales system is the authoritative source of projects and resource records; PMO additions supplement, not replace, the synced data.
- Email delivery depends on a configured SMTP relay (Brevo on port 465 in the deployed environment); without SMTP the system degrades gracefully by logging and skipping.
- The Sales API may be unreachable from the hosting environment; the sync job must tolerate this without crashing.
- Postgres is provisioned (Neon in production); Prisma is the data-access layer.

---

## 8. Out of Scope (this release)

- Direct project creation UI from the PMO (creation is Sales-driven).
- Removal of existing resources from a project.
- Mobile native apps.
- Multi-tenant/org separation beyond role-based access.
- Detailed financial/billing workflows.

---

*End of document.*
