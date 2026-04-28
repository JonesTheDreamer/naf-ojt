# Admin For-Screening Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "For Screening" tab to the admin's View All NAFs page that filters NAFs containing at least one resource request with `FOR_SCREENING` progress.

**Architecture:** The existing admin NAF list uses a `status` string param piped from a tab UI through a React Query hook to the backend `GetNAFsByLocationPagedAsync`. We add one new case in the backend switch and one new tab entry in the frontend — no new abstractions needed.

**Tech Stack:** ASP.NET Core 8 / EF Core (backend), React 19 + TypeScript + React Query (frontend)

---

### Task 1: Add `for_screening` case to NAFRepository

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs:230-246`

- [ ] **Step 1: Add the new switch case**

In `GetNAFsByLocationPagedAsync`, insert the new case before `default:`:

```csharp
case "for_screening":
    query = query.Where(n =>
        n.ResourceRequests.Any(r => r.Progress == Progress.FOR_SCREENING));
    break;
```

The full switch block becomes:

```csharp
switch (status.ToLower())
{
    case "open":
        query = query.Where(n => n.Progress == Progress.OPEN);
        break;
    case "in_progress":
        query = query.Where(n => n.Progress == Progress.IN_PROGRESS);
        break;
    case "accomplished":
        query = query.Where(n => n.Progress == Progress.ACCOMPLISHED);
        break;
    case "for_screening":
        query = query.Where(n =>
            n.ResourceRequests.Any(r => r.Progress == Progress.FOR_SCREENING));
        break;
    default:
        query = query.Where(n =>
            n.Progress == Progress.OPEN ||
            n.Progress == Progress.IN_PROGRESS ||
            n.Progress == Progress.ACCOMPLISHED);
        break;
}
```

- [ ] **Step 2: Build the backend to confirm no compile errors**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/Repositories/NAFRepository.cs
git commit -m "feat: add for_screening filter to admin NAF query"
```

---

### Task 2: Add "For Screening" tab to AdminNAFListPage

**Files:**
- Modify: `NAFClient/src/features/admin/pages/AdminNAFListPage.tsx:11-16`

- [ ] **Step 1: Add the tab entry**

In `STATUS_TABS`, add the new entry after `"in_progress"`:

```ts
const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "For Screening", value: "for_screening" },
  { label: "Accomplished", value: "accomplished" },
] as const;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd NAFClient && npm run build
```

Expected: exits 0 with no type errors.

- [ ] **Step 3: Manually verify in the browser**

Start backend (`cd NAFServer && dotnet run`) and frontend (`cd NAFClient && npm run dev`), log in as admin, open the NAF list page, click "For Screening" — confirm the tab activates and the table shows only NAFs with at least one FOR_SCREENING resource request (or an empty table if none exist).

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/pages/AdminNAFListPage.tsx
git commit -m "feat: add For Screening tab to admin NAF list page"
```
