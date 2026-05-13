# Shared Folder Admin Management — Design Spec

**Date:** 2026-05-13
**Status:** Approved

---

## Overview

Add a Shared Folder management section to the admin side. Admins can create, view, edit, and soft-delete shared folders, and view which employees have (or have requested) access to each folder, filterable by request state.

---

## Data Model Changes

### SharedFolder entity — add `IsActive`

```csharp
public bool IsActive { get; set; } = true;
```

Requires a new EF Core migration. Existing rows default to `true`.

No other schema changes are needed. Employee access is derived from existing `ResourceRequest` + `SharedFolderRequestInfo` records.

---

## Backend

### New endpoints — all `[Authorize(Roles = "ADMIN")]`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/admin/shared-folders` | Paginated list of active folders. Query params: `search`, `page`. Returns `PagedResult<SharedFolderDTO>`. |
| `GET` | `/api/admin/shared-folders/:id` | Folder detail + paginated employee access list. Query params: `progress`, `page`. |
| `POST` | `/api/admin/shared-folders` | Create folder. Body: `{ name, ownerId? }`. |
| `PUT` | `/api/admin/shared-folders/:id` | Update name and/or owner. Body: `{ name, ownerId? }`. |
| `DELETE` | `/api/admin/shared-folders/:id` | Soft-delete — sets `IsActive = false`. |

### Response shapes

**SharedFolderDTO** (list item):
```json
{
  "id": 1,
  "name": "Finance Reports",
  "ownerName": "Juan dela Cruz",
  "ownerId": "EMP-001",
  "isActive": true
}
```

**SharedFolderDetailDTO** (detail page):
```json
{
  "id": 1,
  "name": "Finance Reports",
  "ownerName": "Juan dela Cruz",
  "ownerId": "EMP-001",
  "isActive": true,
  "accessList": {
    "data": [
      {
        "employeeName": "Maria Santos",
        "position": "Accountant",
        "progress": "ACCOMPLISHED",
        "dateRequested": "2026-01-10T00:00:00Z"
      }
    ],
    "totalCount": 12,
    "pageSize": 10,
    "currentPage": 1,
    "totalPages": 2
  }
}
```

### Implementation notes

- List endpoint filters `IsActive == true` and optionally filters by `Name.Contains(search)`.
- Detail endpoint queries `ResourceRequests` joined to `SharedFolderRequestInfo` where `SharedFolderId == id`. Optionally filters by `Progress`. Employee name resolved via `IEmployeeRepository.GetByIdAsync` (cached).
- Owner name resolved via `IEmployeeRepository.GetByIdAsync` for both list and detail.
- Owner search by name or ID reuses existing `GET /api/employees/search` — no new endpoint needed.
- Soft-delete sets `IsActive = false` and saves. Does not affect existing resource requests.
- Cache key `"shared-folders:all"` must be invalidated on create, update, and soft-delete.

---

## Frontend

### Routes

```
/admin/resources/shared-folders        → SharedFolderListPage
/admin/resources/shared-folders/:id    → SharedFolderDetailPage
```

Both are lazy-loaded and wrapped in `ProtectedRoute requiredRole="ADMIN"`.

### Feature module

```
src/features/shared-folders/
├── types.ts
├── api.ts
├── hooks/
│   ├── useSharedFolders.ts          ← paginated list
│   ├── useSharedFolder.ts           ← detail + access list
│   └── useSharedFolderMutations.ts  ← create, update, soft-delete
├── components/
│   ├── SharedFolderFormDialog.tsx   ← create/edit dialog
│   ├── SharedFolderAccessList.tsx   ← employee access table + progress filter
│   └── OwnerSearchInput.tsx         ← name/ID toggle search
└── pages/
    ├── SharedFolderListPage.tsx
    └── SharedFolderDetailPage.tsx
```

### Types

```typescript
interface SharedFolderDTO {
  id: number;
  name: string;
  ownerName: string | null;
  ownerId: string | null;
  isActive: boolean;
}

interface SharedFolderAccessEntryDTO {
  employeeName: string;
  position: string;
  progress: string;
  dateRequested: string;
}

interface SharedFolderDetailDTO extends SharedFolderDTO {
  accessList: PagedResult<SharedFolderAccessEntryDTO>;
}
```

### Sidebar change — `AdminLayout.tsx`

Add "Shared Folders" as an indented nav item directly below the existing "Resources" link. No collapsible group — just visual indentation (`pl-4` on the link) to show hierarchy.

```
Resources          /admin/resources
  Shared Folders   /admin/resources/shared-folders
```

### SharedFolderListPage

- Heading: "Shared Folders"
- Search bar (same pattern as AuditTrailPage) — triggers on Enter or button click.
- Table columns: Name, Owner, Status (Active badge), Actions (edit icon, deactivate icon).
- Create button top-right opens `SharedFolderFormDialog` in create mode.
- Row click navigates to detail page.
- Soft-delete: inline confirmation popover on the deactivate icon — "Deactivate this folder?" with Confirm / Cancel. On confirm, calls delete mutation and invalidates list.
- Pagination (10 per page).

### SharedFolderDetailPage

Layout (top to bottom):

1. **Back link** → `/admin/resources/shared-folders`
2. **Info card**: folder name (large), owner name or "No owner assigned", active status badge, Edit button (opens `SharedFolderFormDialog` in edit mode).
3. **"Employees with Access"** section heading + count.
4. **Progress filter tabs**: All / Open / In Progress / For Screening / Accomplished / Rejected — pill-button style matching existing pages.
5. **SharedFolderAccessList**: table with columns Employee Name, Position, Progress badge, Date Requested. Paginated (10 per page).

### SharedFolderFormDialog

- Mode: create (empty) or edit (pre-filled).
- **Name field**: required text input.
- **Owner field**: optional. Two toggle buttons — "By Name" / "By ID". Both call `GET /api/employees/search?q=`. Results shown as a dropdown list. Selected owner displayed as a dismissible chip showing full name. Clearing the chip sets owner to null.
- Submit: disabled until Name is non-empty. Calls create or update mutation on submit.

### OwnerSearchInput

- Standalone component used inside `SharedFolderFormDialog`.
- Props: `value: { id: string; name: string } | null`, `onChange`.
- Internal state: mode (`"name" | "id"`), query string, results dropdown open/closed.
- Debounced search (300ms) against `/api/employees/search`.
- Renders selected value as a chip; renders search results as a small dropdown.

---

## Routing additions

`routesEnum.ts`:
```typescript
ADMIN_SHARED_FOLDERS = "/admin/resources/shared-folders",
ADMIN_SHARED_FOLDER_DETAIL = "/admin/resources/shared-folders/:id",
```

---

## Out of Scope

- Reactivating a soft-deleted folder (not requested).
- Bulk operations.
- Export/download of access list.
- Notifications on shared folder changes.
