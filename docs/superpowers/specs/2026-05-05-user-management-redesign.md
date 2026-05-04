# User Management Redesign

**Date:** 2026-05-05
**Status:** Approved

## Summary

Replace the separate Roles and Locations admin tabs with a single unified Users tab. The Users tab handles user creation, list view, detail view, and modification of role and location — all in one place.

---

## 1. Navigation & Routing

**Remove:**
- Sidebar nav items: "Roles" (`/admin/roles`) and "Locations" (`/admin/locations`)
- Routes: `ADMIN_ROLES`, `ADMIN_LOCATIONS`
- Pages: `RolesPage.tsx`, `LocationsPage.tsx`

**Add:**
- Sidebar nav item: "Users" → `/admin/users`
- `RoutesEnum.ADMIN_USERS = "/admin/users"`
- `RoutesEnum.ADMIN_USER_DETAIL = "/admin/users/:userId"`
- Lazy-loaded routes for `UsersPage` and `UserDetailPage`, both protected by `requiredRole="ADMIN"`

**`AdminLayout`** nav items updated: Home, NAFs, Implementations, Users.

---

## 2. UsersPage (`/admin/users`)

**Header row:** "Users Management" (h1, amber) on the left; "Add User" button on the right.

**Search bar:** filters the table by name or employee ID (client-side).

**Table columns:** Name | Employee ID | Department | Location | Roles (colored badges). Each row is clickable → navigates to `/admin/users/:userId`.

**Add User dialog:**
- Employee ID input with debounced lookup (400 ms) — shows found/not-found/loading states.
- Role dropdown: ADMIN, MANAGEMENT, REQUESTOR_APPROVER, HR.
- Location dropdown: populated from `locationsQuery`.
- Submit calls `assignRoleMutation({ employeeId, role, locationId })`.
- Dialog resets and closes on success.

The page always shows all users across all locations (no location filter toggle).

---

## 3. UserDetailPage (`/admin/users/:userId`)

**Header:** "← Users" back link + employee full name as page title.

### Employee Info (read-only card)
Fields: Full name, Employee ID, Position, Department, Company.
Source: `UserDTO` (already populated from stored procedure data).

### Roles Section
- Current roles displayed as colored badges (same palette as existing pages).
- Each badge has an ✕ button with inline "Remove? Yes / No" confirmation.
- "Add Role" dropdown below badges; selecting a role calls `assignRoleMutation`.

### Location Section
- Current location shown as an amber badge.
- "Change" button reveals an inline location dropdown. On confirm: if a location is already assigned, call `removeLocationMutation` first, then `assignLocationMutation` with the new location.
- If no location assigned, shows "Assign Location" button that opens the dropdown directly.

---

## 4. Data & Hooks

### `useAdminAllUsers()`
New hook. Fetches all locations (`["admin", "locations"]`), fans out per-location user queries (`["admin", "users", id]`), deduplicates, returns `{ users: UserDTO[], isLoading }`. This is the same fan-out logic currently inside `useAdminLocations.allUsers`, extracted and reusable.

### `useAdminUser(userId: number)`
New hook. Calls `useAdminAllUsers()` and derives the single user by matching `u.id === userId`. Returns `{ user: UserDTO | undefined, isLoading }`. No new backend endpoint required.

### Mutations (unchanged, re-used)
- `assignRoleMutation` — from `useAdminUsers`
- `removeRoleMutation` — from `useAdminUsers`
- `assignLocationMutation` — from `useAdminLocations`
- `removeLocationMutation` — from `useAdminLocations`

These mutations invalidate `["admin", "users"]` on success, keeping both pages in sync via React Query cache.

### Cleanup
`useAdminUsers` location-scoped filtering (the `locationId` parameter, `singleLocationQuery`, and `perLocationQueries` fan-out) can be simplified since the new Users page always fetches all users. `useAdminLocations.allUsers` logic is moved into `useAdminAllUsers`.

---

## 5. Files Changed

| Action | File |
|--------|------|
| Delete | `features/admin/pages/RolesPage.tsx` |
| Delete | `features/admin/pages/LocationsPage.tsx` |
| Add    | `features/admin/pages/UsersPage.tsx` |
| Add    | `features/admin/pages/UserDetailPage.tsx` |
| Add    | `features/admin/hooks/useAdminAllUsers.ts` |
| Modify | `features/admin/hooks/useAdminUsers.ts` (simplify) |
| Modify | `features/admin/hooks/useAdminLocations.ts` (remove allUsers logic) |
| Modify | `shared/components/layout/AdminLayout.tsx` (update nav) |
| Modify | `app/router.tsx` (update routes) |
| Modify | `app/routesEnum.ts` (update enum) |
