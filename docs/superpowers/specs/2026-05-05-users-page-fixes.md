# UsersPage Fixes

**Date:** 2026-05-05
**Status:** Approved

## Summary

Three fixes for the Users admin pages: (1) match the UI pattern of NAF admin pages using `DataTable`, (2) fix a bug where adding a role from `UserDetailPage` could silently fail when the user has no location, and (3) ensure mutations update the page reactively without a reload.

---

## 1. UI Uniformity

**Goal:** Make `UsersPage` look like `AdminNAFListPage` — same spacing, same table component.

**Changes to `UsersPage.tsx`:**
- Wrap all content in `<div className="space-y-4">`.
- Define columns as `ColumnDef<UserDTO>[]` inline (no separate file — columns are simple).
  - Columns: Name | Employee ID | Department | Location | Roles (colored badges).
  - Row click navigates to `/admin/users/:userId`.
- Replace the manual `<div className="rounded-md border"><Table>…</Table></div>` block with `<DataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={…} emptyMessage="No users found." />`.
- Remove the manual `{isLoading && <p>Loading…</p>}` and empty-state paragraph — `DataTable` handles both.
- Keep the header (h1 amber-500 left, "Add User" button right) and the search `<Input>` unchanged.

---

## 2. 401 Bug Fix

**Root cause (identified):** In `UserDetailPage`, `handleAddRole` calls:
```ts
assignRoleMutation.mutateAsync({
  employeeId: user.employeeId,
  role: addRoleValue,
  locationId: user.locationId,   // this is 0 if user has no location assigned
});
```

`AssignRoleToEmployeeAsync` on the backend then calls `AddUserCurrentLocation(userId, 0)`. If no `Location` row with `Id = 0` exists (it won't — auto-increment starts at 1), this can throw a DB constraint violation that is NOT caught by the `catch (KeyNotFoundException)` block, causing the role to never be saved even though the request may partially succeed.

**Fix:** Guard `handleAddRole` in `UserDetailPage` — only allow adding a role when `user.locationId > 0`. If the user has no location, show a warning instead:

```
Cannot add role: this user has no location assigned. Assign a location first.
```

This prevents the bad call. The `locationId: user.locationId` in `handleAddRole` is also conceptually wrong — re-assigning the location on every role-add is a side effect that shouldn't happen. The `AssignRoleToEmployeeAsync` backend method uses `locationId` only to set the user's initial location when first creating their account; subsequent role additions from the detail page should not re-trigger location assignment.

**No backend changes needed.** The backend already handles the happy path correctly.

---

## 3. Reactive Updates (No Reload Required)

**Current behavior:** After a mutation (add role, remove role, change location), the page data does not visibly update until the user manually reloads the browser. This happens because the current `UsersPage` conditionally renders the table only when `!isLoading`, and any brief loading state during query invalidation causes the table to vanish and reappear.

**Fix:** Switching to `DataTable` (Section 1) resolves the visible-reload symptom: `DataTable` shows a skeleton when `isLoading` is true but keeps existing rows visible while React Query refetches in the background (`isFetching = true`, `isLoading = false`). No changes to the mutation invalidation logic are needed — `queryClient.invalidateQueries({ queryKey: ["admin", "users"] })` is already correct and triggers background refetches on all active per-location queries.

**`UserDetailPage`** already uses `users.find(u => u.id === Number(userId))` derived from `useAdminAllUsers`, so when the per-location queries refetch after a mutation, `user` updates and the page rerenders in-place without navigation.

---

## 4. Files Changed

| Action | File |
|--------|------|
| Modify | `NAFClient/src/features/admin/pages/UsersPage.tsx` |
| Modify | `NAFClient/src/features/admin/pages/UserDetailPage.tsx` |
