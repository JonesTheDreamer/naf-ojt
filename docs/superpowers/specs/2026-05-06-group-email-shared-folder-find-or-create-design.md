# Group Email & Shared Folder Find-or-Create — Design Spec

**Date:** 2026-05-06
**Feature:** Replace the fixed-list combobox for Group Email and Shared Folder resource request entries with a free-text input that finds an existing record or creates a new one on submit.

---

## Problem

The current `GroupEmailEntryCard` and `SharedFolderEntryCard` present a combobox pre-populated from a fetched list. Users must pick an existing record; there is no path to request a resource that isn't already seeded. The combobox labels also expose `departmentId` and `remarks` — fields that are being removed from the schema.

---

## Goal

- Users type an email address or shared folder name.
- If the value matches an existing record (case-insensitive), that record's ID is used.
- If it does not match, a new record is created on submit and its ID is used.
- `departmentId` is removed from `GroupEmail`. `departmentId` and `remarks` are removed from `SharedFolder`. Schema migration is handled separately by the developer.
- The existing resource request handler contract (`{ GroupEmailId }` / `{ SharedFolderId }`) is unchanged.

---

## Architecture

A find-or-create endpoint is added for each resource type. The frontend entry cards switch to a create-or-select combobox. On submit, each entry calls the find-or-create endpoint to resolve an ID, then creates the resource request as today. No changes to the request handler pipeline.

---

## Backend Changes

### 1. Entity changes

**`GroupEmail`**
- Remove `DepartmentId` property.
- Constructor becomes `GroupEmail(string email)`.

**`SharedFolder`**
- Remove `DepartmentId` and `Remarks` properties.
- Constructor becomes `SharedFolder(string name)`.

**`SharedFolderSeeder`** — update all `new SharedFolder(...)` calls to the new single-argument constructor. The seeded names remain the same.

Developer creates and applies the EF Core migration after these changes.

---

### 2. New endpoints

#### `POST /api/GroupEmails/find-or-create`

**Request body:**
```json
{ "email": "hr-team@company.com" }
```

**Logic:** Case-insensitive lookup on `GroupEmail.Email`. If found, return it. If not, create `new GroupEmail(email)`, save, and return it.

**Response `200 OK`:**
```json
{ "id": 5, "email": "hr-team@company.com" }
```

#### `POST /api/SharedFolders/find-or-create`

**Request body:**
```json
{ "name": "Finance Reports" }
```

**Logic:** Case-insensitive lookup on `SharedFolder.Name`. If found, return it. If not, create `new SharedFolder(name)`, save, and return it.

**Response `200 OK`:**
```json
{ "id": 3, "name": "Finance Reports" }
```

Both endpoints require `[Authorize]`.

---

### 3. New DTOs

```csharp
// Application/DTOs/GroupEmail/FindOrCreateGroupEmailDTO.cs
public record FindOrCreateGroupEmailDTO(string Email);

// Application/DTOs/SharedFolder/FindOrCreateSharedFolderDTO.cs
public record FindOrCreateSharedFolderDTO(string Name);
```

---

### 4. Service methods

Add to `IGroupEmailService` / `GroupEmailService`:
```csharp
Task<GroupEmail> FindOrCreateAsync(string email);
```

Add to `ISharedFolderService` / `SharedFolderService`:
```csharp
Task<SharedFolder> FindOrCreateAsync(string name);
```

Each implementation: `FirstOrDefaultAsync` with `StringComparison.OrdinalIgnoreCase`, then create + save if null.

---

### 5. Unchanged

- `GroupEmailRequestHandler.CreateAdditionalInfo` — still receives `{ GroupEmailId: int }` and does `FindAsync`.
- `SharedFolderRequestHandler.CreateAdditionalInfo` — still receives `{ SharedFolderId: int }` and does `FindAsync`.
- Existing `GET /api/GroupEmails` and `GET /api/SharedFolders` — still return all records (used for typeahead suggestions).

---

## Frontend Changes

### 1. Type changes in `useAddResource.ts`

```ts
// before
export type GroupEmailEntry = {
  _id: string;
  groupEmailId: number | null;
  purpose: string;
  dateNeeded: string;
};

export type SharedFolderEntry = {
  _id: string;
  sharedFolderId: number | null;
  purpose: string;
  dateNeeded: string;
};

// after
export type GroupEmailEntry = {
  _id: string;
  email: string;
  isNew: boolean;
  purpose: string;
  dateNeeded: string;
};

export type SharedFolderEntry = {
  _id: string;
  name: string;
  isNew: boolean;
  purpose: string;
  dateNeeded: string;
};
```

Initial entry factories:
```ts
// before
{ _id: newEntry(), groupEmailId: null, purpose: "", dateNeeded: "" }
{ _id: newEntry(), sharedFolderId: null, purpose: "", dateNeeded: "" }

// after
{ _id: newEntry(), email: "", isNew: false, purpose: "", dateNeeded: "" }
{ _id: newEntry(), name: "", isNew: false, purpose: "", dateNeeded: "" }
```

Completion validation:
```ts
// before
const isGroupEmailEntryComplete = (e) => e.groupEmailId !== null && e.purpose.trim().length > 0;
const isSharedFolderEntryComplete = (e) => e.sharedFolderId !== null && e.purpose.trim().length > 0;

// after
const isGroupEmailEntryComplete = (e) => e.email.trim().length > 0 && e.purpose.trim().length > 0;
const isSharedFolderEntryComplete = (e) => e.name.trim().length > 0 && e.purpose.trim().length > 0;
```

---

### 2. New API functions in `naf/api.ts`

```ts
export const findOrCreateGroupEmail = async (email: string): Promise<{ id: number; email: string }> =>
  (await api.post("/GroupEmails/find-or-create", { email })).data;

export const findOrCreateSharedFolder = async (name: string): Promise<{ id: number; name: string }> =>
  (await api.post("/SharedFolders/find-or-create", { name })).data;
```

---

### 3. Submit logic in `useAddResource.ts`

```ts
// Group email entries
params.groupEmailEntries.forEach((entry) => {
  specialTasks.push(
    findOrCreateGroupEmail(entry.email.trim())
      .then(({ id }) =>
        createResourceRequest({
          nafId: params.nafId,
          resourceId: GROUP_EMAIL_RESOURCE_ID,
          purpose: entry.purpose,
          additionalInfo: { GroupEmailId: id },
          dateNeeded: entry.dateNeeded || null,
        })
      )
      .then(() => { anySuccess = true; })
      .catch((e: unknown) => { errors.push(`Group email: ${msg}`); })
  );
});

// Shared folder entries
params.sharedFolderEntries.forEach((entry) => {
  specialTasks.push(
    findOrCreateSharedFolder(entry.name.trim())
      .then(({ id }) =>
        createResourceRequest({
          nafId: params.nafId,
          resourceId: SHARED_FOLDER_RESOURCE_ID,
          purpose: entry.purpose,
          additionalInfo: { SharedFolderId: id },
          dateNeeded: entry.dateNeeded || null,
        })
      )
      .then(() => { anySuccess = true; })
      .catch((e: unknown) => { errors.push(`Shared folder: ${msg}`); })
  );
});
```

Entries of different types still run in parallel via `Promise.allSettled`.

---

### 4. `GroupEmailEntryCard.tsx` — rewritten

**Props:**
```ts
interface GroupEmailEntryCardProps {
  entry: GroupEmailEntry;
  allGroupEmails: { id: number; email: string }[];
  usedEmails: string[];
  onChange: (patch: Partial<GroupEmailEntry>) => void;
  onRemove: () => void;
}
```

**UX:** A create-or-select combobox using ShadCN `Command`. As the user types, the list filters existing emails case-insensitively. If the typed value has no exact match, a "Use **[value]**" option appears at the bottom. Selecting an existing option sets `{ email, isNew: false }`; selecting the create option sets `{ email, isNew: true }`. A small badge — `Existing` (blue) or `New` (amber) — appears next to the input once a value is committed.

Removed fields: `departmentId` column from display. Fields remaining: email combobox, Purpose textarea, Date Needed picker.

---

### 5. `SharedFolderEntryCard.tsx` — rewritten

**Props:**
```ts
interface SharedFolderEntryCardProps {
  entry: SharedFolderEntry;
  allSharedFolders: { id: number; name: string }[];
  usedNames: string[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}
```

Same combobox UX as `GroupEmailEntryCard`. Selecting existing sets `{ name, isNew: false }`; create option sets `{ name, isNew: true }`.

Removed fields: `departmentId` and `remarks` columns from display. Fields remaining: name combobox, Purpose textarea, Date Needed picker.

---

### 6. `AddResourceDialog.tsx` — prop updates only

Pass `allGroupEmails` as `{ id, email }[]` (drop `departmentId` from mapping).
Pass `allSharedFolders` as `{ id, name }[]` (drop `departmentId` and `remarks` from mapping).
Pass `usedEmails` and `usedNames` string arrays (derived from already-added entries).

---

## Data Flow

```
User types email/name in combobox
  → filters existing list client-side
  → selects existing record OR types new value

On submit (useAddResource):
  → POST /GroupEmails/find-or-create { email }   ← resolves ID
  → POST /Requests { ..., additionalInfo: { GroupEmailId: id } }

Backend (unchanged path):
  → GroupEmailRequestHandler.CreateAdditionalInfo({ GroupEmailId })
  → FindAsync(id) → GroupEmailRequestInfo
```

---

## Files Changed

| File | Change |
|------|--------|
| `NAFServer/.../Entities/GroupEmail.cs` | Remove `DepartmentId` |
| `NAFServer/.../Entities/SharedFolder.cs` | Remove `DepartmentId`, `Remarks` |
| `NAFServer/.../Seeder/SharedFolderSeeder.cs` | Update constructor calls |
| `NAFServer/.../DTOs/GroupEmail/FindOrCreateGroupEmailDTO.cs` | **New** |
| `NAFServer/.../DTOs/SharedFolder/FindOrCreateSharedFolderDTO.cs` | **New** |
| `NAFServer/.../Interfaces/IGroupEmailService.cs` | Add `FindOrCreateAsync` |
| `NAFServer/.../Interfaces/ISharedFolderService.cs` | Add `FindOrCreateAsync` |
| `NAFServer/.../Services/GroupEmailService.cs` | Implement `FindOrCreateAsync` |
| `NAFServer/.../Services/SharedFolderService.cs` | Implement `FindOrCreateAsync` |
| `NAFServer/.../Controllers/GroupEmailsController.cs` | Add `find-or-create` action |
| `NAFServer/.../Controllers/SharedFoldersController.cs` | Add `find-or-create` action |
| `NAFClient/.../hooks/useAddResource.ts` | Update types + submit logic |
| `NAFClient/.../api.ts` | Add `findOrCreateGroupEmail`, `findOrCreateSharedFolder` |
| `NAFClient/.../add-resource/GroupEmailEntryCard.tsx` | Rewrite with combobox |
| `NAFClient/.../add-resource/SharedFolderEntryCard.tsx` | Rewrite with combobox |
| `NAFClient/.../add-resource/AddResourceDialog.tsx` | Update prop shapes |

---

## What Does Not Change

- `GroupEmailRequestHandler` and `SharedFolderRequestHandler` — unchanged, still receive integer IDs
- `GroupEmailInfoRequestDTO` and `SharedFolderInfoRequestDTO` — unchanged
- `GroupEmailRequestInfo` and `SharedFolderRequestInfo` entities — unchanged
- Internet resource entry flow — unchanged
- Basic resource entry flow — unchanged
- Existing `GET /GroupEmails` and `GET /SharedFolders` endpoints — unchanged
