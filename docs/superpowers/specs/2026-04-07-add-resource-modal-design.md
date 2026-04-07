# Add Resource to Existing NAF — Design Spec

**Date:** 2026-04-07  
**Status:** Approved

---

## Overview

When viewing a NAF detail page, the requestor can click **+ Add Resources** to open a modal that lets them add one or more resources to an existing NAF in a single submission. Basic (non-special) resources use checkboxes. Special resources (Internet, Group Email, Shared Folder) each have a multi-entry section where the user can add one or more entries, each with its own additional-info form.

---

## Backend Changes

### 1. New Lookup Endpoints

Four new controllers/endpoints to expose reference data needed by the frontend forms:

| Endpoint | Response |
|---|---|
| `GET /api/InternetPurposes` | `[{ id, name, description }]` |
| `GET /api/InternetResources` | `[{ id, name, url, description, purposeId }]` |
| `GET /api/GroupEmails` | `[{ id, email, departmentId }]` |
| `GET /api/SharedFolders` | `[{ id, name, remarks, departmentId }]` |

- `InternetPurpose` and `InternetResource` already have repositories and can follow the same controller pattern as `ResourcesController`.
- `GroupEmail` and `SharedFolder` need thin repositories (following `InternetPurposeRepository` — `CacheService` pattern) and services before controllers are added.

### 2. Add Basic Resources to Existing NAF

**`POST /api/NAFs/{nafId}/resources/basic`**

Request body:
```json
{ "resourceIds": [3, 7, 8] }
```

Response:
```json
[
  { "resourceId": 3, "success": true, "data": { ... } },
  { "resourceId": 7, "success": false, "error": "Resource already exists in NAF" },
  { "resourceId": 8, "success": true, "data": { ... } }
]
```

- Iterates through each `resourceId`, calls `ResourceRequestService.CreateBasicAsync` per ID.
- Catches per-item exceptions and accumulates results — does not short-circuit on failure.
- Backend also validates that the resource is not already in the NAF; throws a descriptive error if duplicate.

### 3. Fix Duplicate Validation for Special Resources

`ResourceRequestService.CreateSpecialAsync` currently calls `handler.CreateAdditionalInfo` without ever calling `handler.Validate`. As part of this work:

- Call `handler.Validate(additionalInfo, nafId)` before saving.
- If validation returns `false`, throw a descriptive `ApplicationException` (e.g., `"Internet resource 'Facebook' is already requested in this NAF"`).

This ensures duplicates are blocked even if the frontend filtering is bypassed.

### 4. Extend AdditionalInfo DTOs

The current DTOs are missing IDs and display fields needed by the frontend for filtering and rendering. Update as follows:

| DTO | Add fields |
|---|---|
| `InternetInfoDTO` | `int InternetResourceId` |
| `SharedFolderInfoDTO` | `int SharedFolderId`, `string Remarks` |
| `GroupEmailInfoDTO` | `int GroupEmailId`, `string DepartmentId` |

Update `AdditionalInfoMapper.MapAdditionalInfo` to populate these from the navigation properties (e.g., `internet.InternetResourceId`, `folder.SharedFolder.Remarks`, `email.GroupEmail.DepartmentId`).

Update the frontend `naf.ts` types to match:

```typescript
export interface InternetRequestInfo extends BaseAdditionalInfo {
  type: 0;
  internetResourceId: number;  // added
  purpose: string;
  resource: string;
}
export interface SharedFolderInfo extends BaseAdditionalInfo {
  type: 1;
  sharedFolderId: number;      // added
  name: string;
  departmentId: string;
  remarks: string;             // added
}
export interface GroupEmailInfo extends BaseAdditionalInfo {
  type: 2;
  groupEmailId: number;        // added
  email: string;
  departmentId: string;        // added
}
```

---

## Frontend Changes

### New Files

| File | Role |
|---|---|
| `services/EntityAPI/resourceMetadataService.ts` | API calls for internet purposes, internet resources, group emails, shared folders |
| `features/resources/hooks/useResourceMetadata.tsx` | React Query wrappers for the 4 lookup endpoints (long `staleTime`) |
| `features/naf/hooks/useAddResource.ts` | Mutations for basic + special resource creation; `Promise.allSettled` partial-success logic |
| `features/naf/components/addResourceDialog.tsx` | The modal component |

### New Types

Add to `types/api/naf.ts` (or a new `types/api/resourceMetadata.ts`):

```typescript
export interface InternetPurposeItem  { id: number; name: string; description: string; }
export interface InternetResourceItem { id: number; name: string; url: string; description?: string; purposeId: number; }
export interface GroupEmailItem       { id: number; email: string; departmentId: string; }
export interface SharedFolderItem     { id: number; name: string; remarks: string; departmentId: string; }
```

### State Model (`AddResourceDialog`)

```typescript
type InternetEntry     = { _id: string; internetPurposeId: number|null; internetResourceId: number|null; purpose: string }
type GroupEmailEntry   = { _id: string; groupEmailId: number|null; purpose: string }
type SharedFolderEntry = { _id: string; sharedFolderId: number|null; purpose: string }

// component state
selectedBasic:       number[]
internetEntries:     InternetEntry[]
groupEmailEntries:   GroupEmailEntry[]
sharedFolderEntries: SharedFolderEntry[]
errors:              string[]   // per-resource failure messages shown inline
```

`_id` is a client-side `crypto.randomUUID()` used as React key and for targeted state updates/removals.

### `useAddResource` Hook

```typescript
// mutations exposed:
addBasicResources(nafId: string, resourceIds: number[])  // POST /api/NAFs/{nafId}/resources/basic
createSpecialRequest(payload: CreateResourceRequestDTO)  // POST /api/Requests
```

On submit from the dialog:
1. Fire `addBasicResources` if `selectedBasic.length > 0`.
2. Build one `CreateResourceRequestDTO` per internet/group-email/shared-folder entry and fire all via `Promise.allSettled`.
3. Collect failures → set `errors` state; dialog stays open.
4. On any success → `queryClient.invalidateQueries({ queryKey: ["naf", nafId] })`.
5. If all succeed → close and reset dialog.

### Modal Layout

```
┌─────────────────────────────────────────────────┐
│ Add Resources                                   │
│ NAF #REF-XXXX                                   │
├─────────────────────────────────────────────────┤
│ BASIC RESOURCES                                 │
│  ☐ Email   ☐ Printer   ☐ VPN  ...              │
│  (only resources not already in NAF shown)      │
│                                                 │
│ SPECIAL RESOURCES                               │
│                                                 │
│ Internet Access                  [+ Add Entry]  │
│ ┌──────────────────────────────────────────┐    │
│ │ Purpose Category  [dropdown ▾]      [✕] │    │
│ │ Internet Resource [dropdown ▾]           │    │
│ │   (disabled until purpose chosen;        │    │
│ │    already-used resources excluded)      │    │
│ │ Purpose of Access [textarea]             │    │
│ └──────────────────────────────────────────┘    │
│  + more entries stack here                      │
│                                                 │
│ Group Email                      [+ Add Entry]  │
│ ┌──────────────────────────────────────────┐    │
│ │ Group Email  [searchable combobox ▾]     │    │
│ │   shows: email — Department              │    │
│ │   (already-used emails excluded)    [✕] │    │
│ │ Purpose of Access [textarea]             │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ Shared Folder                    [+ Add Entry]  │
│ ┌──────────────────────────────────────────┐    │
│ │ Shared Folder [searchable combobox ▾]    │    │
│ │   shows: name — Dept — remarks      [✕] │    │
│ │ Purpose of Access [textarea]             │    │
│ └──────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│ • Failed: Internet 'Facebook' already in NAF    │  ← inline errors on partial failure
│                      [Cancel]  [Add Resources]  │
└─────────────────────────────────────────────────┘
```

### Duplicate Filtering

Before rendering options in each special-resource dropdown/combobox, compute the already-used IDs from `naf.resourceRequests`:

```typescript
// internet resources already requested in this NAF
const usedInternetResourceIds = naf.resourceRequests
  .filter(r => r.additionalInfo?.type === 0)
  .map(r => (r.additionalInfo as InternetRequestInfo).internetResourceId)

const usedGroupEmailIds = naf.resourceRequests
  .filter(r => r.additionalInfo?.type === 2)
  .map(r => (r.additionalInfo as GroupEmailInfo).groupEmailId)

const usedSharedFolderIds = naf.resourceRequests
  .filter(r => r.additionalInfo?.type === 1)
  .map(r => (r.additionalInfo as SharedFolderInfo).sharedFolderId)
```

Also validate across entries within the same submission: no two internet entries can share the same `internetResourceId` — show a validation error before firing the API.

### Integration Point

In `ViewNAFDetail.tsx` → `RequestsSection`:

```tsx
const [addResourceOpen, setAddResourceOpen] = useState(false);
// ...
<Button onClick={() => setAddResourceOpen(true)}>+ Add Resources</Button>
<AddResourceDialog naf={naf} open={addResourceOpen} onOpenChange={setAddResourceOpen} />
```

### Submit Button Disabled When

- No basic resources are checked AND no special entries exist
- Any existing special entry is incomplete (missing required fields)

---

## Searchable Combobox Pattern

Group Email and Shared Folder use a `Popover + Command` combobox (ShadCN `command.tsx` already exists). The user can type to filter the list. Each option displays:
- Group Email: `email — departmentId`
- Shared Folder: `name — departmentId — remarks`

---

## Error Handling Summary

| Layer | What happens |
|---|---|
| Frontend pre-submit | Validates no duplicate `internetResourceId`/`groupEmailId`/`sharedFolderId` across entries in the current submission |
| Frontend pre-render | Excludes already-NAF-requested options from dropdowns |
| Backend `CreateSpecialAsync` | Calls `handler.Validate()` and throws descriptive error on duplicate |
| Backend basic endpoint | Per-item try/catch; returns partial results array |
| Frontend post-submit | `Promise.allSettled` collects failures; shows inline error list; dialog stays open until all succeed |
