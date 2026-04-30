---
title: Locations Page Revamp
date: 2026-04-30
status: approved
---

# Locations Page Revamp Design

## Goal

Revise `LocationsPage.tsx` to match the UI/UX pattern of `RolesPage.tsx`. The two pages manage parallel concerns (roles vs. locations) and should feel consistent. The current Locations page uses an old inline form with native selects and a plain div list; the Roles page uses a Dialog form, Card list, search filter, and inline remove confirmation.

## Scope

Frontend only. All required backend endpoints already exist. No backend changes needed.

---

## Changes

### 1. `adminApi` — add `removeLocation`

Add one missing API call:

```ts
removeLocation: (userId: number, locationId: number) =>
  api.delete(`/user-locations/${userId}/remove/${locationId}`).then((r) => r.data),
```

### 2. `useAdminLocations` hook — add `removeLocationMutation` + `allUsers`

**`removeLocationMutation`**: calls `adminApi.removeLocation`, invalidates `["admin", "users"]` on success, shows toast.

**`allUsers`**: a flat list of all `UserDTO` records across every location, needed to cross-reference employee search results in the assign dialog. Uses the same multi-query pattern already in `useAdminUsers(null)`:
- First fetch all locations (`["admin", "locations"]` — already in the hook)
- Then `useQueries` one `getUsers(locationId)` per location
- Flatten results into `allUsers: UserDTO[]`

This avoids a separate hook call in the page and keeps location-related state co-located.

### 3. `LocationsPage.tsx` — full revision

#### Header

```
[Locations Management (amber)]          [My Location | View All]  [Assign Location btn]
```

- "View All / My Location" toggle (same as current and RolesPage)
- "Assign Location" button opens a Dialog

#### Assign Location Dialog

Mirrors "Assign Role" dialog in RolesPage:

| Field | Behavior |
|---|---|
| Employee ID | Text input, 400ms debounce → `searchEmployees(id)` |
| Employee preview | Green text if found in `allUsers` (name · position); red "No system account found. Assign a role first." if found in HR but not in `allUsers`; grey "Employee not found" if not in HR |
| Location | Dropdown from `locationsQuery.data` |

On submit:
- Validate employee is found in `allUsers` (has a system account); get their internal `id`
- Call `assignLocationMutation({ userId, locationId })`
- Reset form, close dialog on success

#### Search + User List

Search input (same as RolesPage): filters `users` by `firstName + lastName + employeeId`.

Card per user:
```
[Full Name]                              [Location Badge ✕]
[employeeId · location]
```

- Location shown as a colored badge (amber tone to match the page theme)
- `✕` button → inline "Remove? Yes No" confirm (same pattern as RolesPage role remove)
- Remove calls `removeLocationMutation({ userId: u.id, locationId: u.locationId })`
- Users with no location (`locationId === 0` or location empty): show a muted "—" placeholder, no remove button

#### Removed

- "Available Locations" section (redundant with the assign dialog dropdown)
- Inline assign form card (replaced by Dialog)

---

## State

```ts
// page-level
viewAll: boolean
search: string
pendingRemove: { userId: number; locationId: number } | null

// dialog
sheetOpen: boolean
employeeId: string
selectedLocationId: number
empLookup: { state: "idle"|"loading"|"found"|"not_found"|"no_account"; employee: Employee | null; userId: number | null }
formError: string
```

The `empLookup` state machine gains a `"no_account"` state (employee found in HR but not in `allUsers`).

---

## File Checklist

| File | Change |
|---|---|
| `NAFClient/src/features/admin/api.ts` | Add `removeLocation` |
| `NAFClient/src/features/admin/hooks/useAdminLocations.ts` | Add `removeLocationMutation`, `allUsers` |
| `NAFClient/src/features/admin/pages/LocationsPage.tsx` | Full revision |
