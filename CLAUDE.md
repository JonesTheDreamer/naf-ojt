# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

**Network Access Form (NAF) System** — A full-stack application for managing employee network access requests, approvals, and tracking.

- **Backend:** `NAFServer/` — ASP.NET Core 8, EF Core + SQL Server
- **Frontend:** `NAFClient/` — React 19 + TypeScript, Vite, Tailwind CSS v4, ShadCN

---

## Development Commands

### Backend (`NAFServer/`)
```bash
dotnet run          # Start API server (http://localhost:5186)
dotnet build        # Build the project
dotnet ef migrations add <Name>   # Add EF migration
dotnet ef database update         # Apply migrations
```

### Frontend (`NAFClient/`)
```bash
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # TypeScript check + Vite build
npm run lint        # ESLint
```

### Environment
- Frontend API URL is configured in `NAFClient/.env`: `VITE_API_URL=http://localhost:5186/api`
- Database connection string is in `NAFServer/appsettings.json` (SQL Server `DbNAF`)
- CORS is configured to allow `http://localhost:5173` only

---

## Backend Architecture

The backend follows a layered architecture under `NAFServer/src/`:

```
API/Controllers/         → HTTP endpoints (NAFsController, RequestsController, ApprovalStepsController, etc.)
Application/
  Services/              → Business logic (NAFService, ResourceRequestService, etc.)
  Interfaces/            → Service contracts
  DTOs/                  → Request/response shapes
  Handlers/              → Strategy pattern for resource-type-specific request creation
Domain/
  Entities/              → EF Core domain models (NAF, ResourceRequest, Employee, etc.)
  Interface/Repository/  → Repository contracts
  Enums/                 → Status, Progress, ApproverRole, StepAction
Infrastructure/
  Persistence/
    Repositories/        → EF Core repository implementations
    Seeder/              → Seed data for workflows, shared folders, internet resources
  Helper/CacheService    → IMemoryCache wrapper (singleton)
Mapper/                  → NAFMapper, ResourceMapper, AdditionalInfoMapper
```

### Key Patterns

**Employee data via stored procedures** — `EmployeeRepository` never queries the `Employees` table directly. It calls SQL stored procedures: `sp_GetEmployeeDetails`, `sp_GetSubordinates`, `sp_SearchEmployee`. Results are cached for 4 hours via `CacheService`.

**Polymorphic AdditionalInfo** — `ResourceRequest` has a `AdditionalInfo` navigation property that can be one of: `InternetRequestInfo`, `SharedFolderRequestInfo`, or `GroupEmailRequestInfo`. EF Core uses TPH (Table-Per-Hierarchy). Loading these requires separate queries (see `NAFRepository.GetNAFToApprove` for the pattern).

**Resource request handler registry** — When creating a resource request, `ResourceRequestHandlerRegistry` dispatches to the correct `IResourceRequestHandler` implementation based on `ResourceId`. Current handlers: `InternetRequestHandler`, `SharedFolderRequestHandler`, `GroupEmailRequestHandler`.

**Approval workflow** — Each `ResourceRequest` has `ResourceRequestApprovalStep` records (one per approver). Steps are created from `ApprovalWorkflowStepsTemplate`. Approval cascades: when all steps for a resource request are approved, the NAF checks if all its resource requests are done.

**`IncludeResourceRequestsWithAdditionalInfo()`** — Extension method in `ResourceRequestQueryExtensions.cs` that handles the standard EF includes for NAF queries.

---

## Frontend Architecture

```
src/
  app/              → router.tsx (lazy routes), queryClient.ts, routesEnum.ts
  features/naf/     → Feature-based module
    components/     → nafList, nafColumns, createNAFDialog, resourceRequestAccordion, etc.
    hooks/          → useNAF.ts, useResourceRequest.ts (React Query + mutations)
    pages/          → ViewAllNAF.tsx, ViewNAFDetail.tsx
  services/
    api.tsx         → Axios instance (baseURL from VITE_API_URL)
    EntityAPI/      → nafService.ts, resourceService.ts, resourceRequestService.ts, employeeService.ts
  components/
    ui/             → ShadCN components
    layout/         → Header, Sidebar, Layout
  types/
    api/            → naf.ts, employee.ts, entity.ts
    enum/           → status.ts, progress.ts, hardware.ts, stepAction.ts
    common/         → pagedResult.ts
  global/component/ → Shared non-ShadCN components (e.g. select.tsx)
```

### Key Patterns

**React Query** — All server state uses `@tanstack/react-query`. Custom hooks in `features/*/hooks/` compose queries and mutations and are the primary data-access layer for pages/components.

**Route structure** — Routes are `/:employeeId` (list view) and `/:employeeId/:nafId` (detail view). The `employeeId` in the URL drives which NAFs and approval queues are shown.

**Pagination** — APIs return `PagedResult<T>` (page size 6). Frontend tracks `subordinatePage` and `approvalPage` separately in `useEmployeeNAF`.

---

## Domain Concepts

- **NAF (Network Access Form)** — The top-level request entity. One NAF per employee per department. Contains multiple `ResourceRequest` records.
- **ResourceRequest** — A request for a specific resource within a NAF. Has a `Progress` status and optional `AdditionalInfo`.
- **Basic vs Special Resources** — Basic resources are auto-approved; special resources require an approval workflow.
- **Approval Step** — Each approver in the workflow has a `ResourceRequestApprovalStep`. Actions are recorded in `ResourceRequestApprovalStepHistory`.
- **Progress enum** — `OPEN → IN_PROGRESS → FOR_SCREENING → ACCOMPLISHED` (or `REJECTED / NOT_ACCOMPLISHED`).
- **Employee** — Identified by employee number (string), details fetched from stored procedures, not stored in the app DB.
