# Resource Requests Action Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add For Screening and For Implementation action sections above the existing paginated table on AdminResourceRequestsPage so admins can claim screening steps and manage implementation tasks without navigating away.

**Architecture:** New backend endpoint returns `AdminForScreeningItemDTO[]` for screening items with step IDs. Existing `/implementations/for-implementations` and `/implementations/my-tasks` endpoints already return `NAF[]` with all needed data — no backend changes needed for implementation. Three new hooks, a shared `ActionCard` shell, and two section components are composed into the existing page.

**Tech Stack:** ASP.NET Core 8, EF Core, React 19, TanStack Query v5, Tailwind CSS v4, ShadCN

---

## File Map

**Create:**
- `NAFServer/src/Application/DTOs/Admin/AdminForScreeningItemDTO.cs`
- `NAFClient/src/features/admin/hooks/useForScreening.ts`
- `NAFClient/src/features/admin/hooks/useForImplementation.ts`
- `NAFClient/src/features/admin/hooks/useMyImplementationTasks.ts`
- `NAFClient/src/features/admin/components/ActionCard.tsx`
- `NAFClient/src/features/admin/components/ForScreeningSection.tsx`
- `NAFClient/src/features/admin/components/ForImplementationSection.tsx`

**Modify:**
- `NAFServer/src/Application/Interfaces/INAFService.cs` — add `GetForScreeningAsync`
- `NAFServer/src/Application/Services/NAFService.cs` — implement `GetForScreeningAsync`
- `NAFServer/src/API/Controllers/AdminController.cs` — add endpoint
- `NAFClient/src/features/admin/types.ts` — add `AdminForScreeningItem`
- `NAFClient/src/features/admin/api.ts` — add `getForScreening`
- `NAFClient/src/features/admin/pages/AdminResourceRequestsPage.tsx` — mount sections

---

### Task 1: Backend DTO

**Files:**
- Create: `NAFServer/src/Application/DTOs/Admin/AdminForScreeningItemDTO.cs`

- [ ] **Step 1: Create the DTO**

```csharp
namespace NAFServer.src.Application.DTOs.Admin
{
    public record AdminForScreeningItemDTO(
        Guid ResourceRequestId,
        Guid NafId,
        string NafReference,
        string EmployeeName,
        string ResourceName,
        DateTime? DateNeeded,
        Guid CurrentStepId,
        string? StepClaimedBy
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFServer/src/Application/DTOs/Admin/AdminForScreeningItemDTO.cs
git commit -m "feat: add AdminForScreeningItemDTO"
```

---

### Task 2: Backend Service — GetForScreeningAsync

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/INAFService.cs`
- Modify: `NAFServer/src/Application/Services/NAFService.cs`

- [ ] **Step 1: Add method to interface**

In `INAFService.cs`, add after the existing `GetNAFsByLocationPagedAsync` line:

```csharp
Task<List<AdminForScreeningItemDTO>> GetForScreeningAsync(int locationId);
```

Also add the using at the top of the file if not present:
```csharp
using NAFServer.src.Application.DTOs.Admin;
```

- [ ] **Step 2: Implement in NAFService**

In `NAFService.cs`, add after `GetNAFsByLocationPagedAsync`:

```csharp
public async Task<List<AdminForScreeningItemDTO>> GetForScreeningAsync(int locationId)
{
    var requests = await _context.ResourceRequests
        .Where(rr => rr.Progress == Progress.FOR_SCREENING && rr.NAF.LocationId == locationId)
        .Include(rr => rr.NAF)
        .Include(rr => rr.Resource)
        .Include(rr => rr.ResourceRequestsApprovalSteps)
        .AsNoTracking()
        .ToListAsync();

    var result = new List<AdminForScreeningItemDTO>();
    foreach (var rr in requests)
    {
        var employee = await _employeeRepository.GetByIdAsync(rr.NAF.EmployeeId);
        var employeeName = employee != null
            ? $"{employee.FirstName} {employee.LastName}".Trim()
            : rr.NAF.EmployeeId;

        var currentStep = rr.ResourceRequestsApprovalSteps
            .FirstOrDefault(s => s.StepOrder == rr.CurrentStep);

        if (currentStep == null) continue;

        result.Add(new AdminForScreeningItemDTO(
            rr.Id,
            rr.NAFId,
            rr.NAF.Reference,
            employeeName,
            rr.Resource.Name,
            rr.DateNeeded == default(DateTime) ? null : rr.DateNeeded,
            currentStep.Id,
            currentStep.ApproverId
        ));
    }
    return result;
}
```

Check that `NAFService.cs` already has these usings (add any that are missing):
```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Domain.Enums;
```

- [ ] **Step 3: Build the backend to confirm no compile errors**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Interfaces/INAFService.cs \
        NAFServer/src/Application/Services/NAFService.cs
git commit -m "feat: implement GetForScreeningAsync in NAFService"
```

---

### Task 3: Backend Controller Endpoint

**Files:**
- Modify: `NAFServer/src/API/Controllers/AdminController.cs`

- [ ] **Step 1: Add the endpoint**

In `AdminController.cs`, add after the existing `GetAdminNAFs` endpoint:

```csharp
[HttpGet("resource-requests/for-screening")]
public async Task<IActionResult> GetForScreening([FromQuery] int locationId)
{
    return Ok(await _nafService.GetForScreeningAsync(locationId));
}
```

- [ ] **Step 2: Build and smoke-test**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

Start the server (`dotnet run`) and hit the endpoint in a browser or curl:
```
GET http://localhost:5186/api/admin/resource-requests/for-screening?locationId=1
```
Expected: JSON array (may be empty if no FOR_SCREENING requests exist).

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/AdminController.cs
git commit -m "feat: add GET /admin/resource-requests/for-screening endpoint"
```

---

### Task 4: Frontend Types and API Function

**Files:**
- Modify: `NAFClient/src/features/admin/types.ts`
- Modify: `NAFClient/src/features/admin/api.ts`

- [ ] **Step 1: Add AdminForScreeningItem type**

In `types.ts`, append at the bottom:

```typescript
export interface AdminForScreeningItem {
  resourceRequestId: string;
  nafId: string;
  nafReference: string;
  employeeName: string;
  resourceName: string;
  dateNeeded: string | null;
  currentStepId: string;
  stepClaimedBy: string | null;
}
```

- [ ] **Step 2: Add API function**

In `api.ts`, add the import at the top:

```typescript
import type {
  AdminResourceRequestDTO,
  AdminForScreeningItem,
  CreateUserDTO,
  ForImplementationItemDTO,
  LocationDTO,
  UserDTO,
  UserRoleDetailDTO,
} from "./types";
```

Then add after `getAdminResourceRequests`:

```typescript
  getForScreening: (locationId: number) =>
    api
      .get<AdminForScreeningItem[]>("/admin/resource-requests/for-screening", {
        params: { locationId },
      })
      .then((r) => r.data),
```

- [ ] **Step 3: Type-check**

```bash
cd NAFClient && npm run build
```

Expected: no type errors (build may fail on other things but there should be no errors in `types.ts` or `api.ts`).

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/types.ts \
        NAFClient/src/features/admin/api.ts
git commit -m "feat: add AdminForScreeningItem type and getForScreening API call"
```

---

### Task 5: Frontend Hooks

**Files:**
- Create: `NAFClient/src/features/admin/hooks/useForScreening.ts`
- Create: `NAFClient/src/features/admin/hooks/useForImplementation.ts`
- Create: `NAFClient/src/features/admin/hooks/useMyImplementationTasks.ts`

- [ ] **Step 1: Create useForScreening**

```typescript
// NAFClient/src/features/admin/hooks/useForScreening.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useForScreening(locationId: number | null) {
  return useQuery({
    queryKey: ["admin", "for-screening", locationId],
    queryFn: () => adminApi.getForScreening(locationId!),
    enabled: locationId !== null,
    placeholderData: keepPreviousData,
  });
}
```

- [ ] **Step 2: Create useForImplementation**

```typescript
// NAFClient/src/features/admin/hooks/useForImplementation.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useForImplementation(locationId: number | null) {
  return useQuery({
    queryKey: ["admin", "for-implementation", locationId],
    queryFn: () => adminApi.getForImplementations(locationId!),
    enabled: locationId !== null,
    placeholderData: keepPreviousData,
  });
}
```

- [ ] **Step 3: Create useMyImplementationTasks**

```typescript
// NAFClient/src/features/admin/hooks/useMyImplementationTasks.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api";

export function useMyImplementationTasks() {
  return useQuery({
    queryKey: ["admin", "my-implementation-tasks"],
    queryFn: adminApi.getMyTasks,
    placeholderData: keepPreviousData,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/hooks/useForScreening.ts \
        NAFClient/src/features/admin/hooks/useForImplementation.ts \
        NAFClient/src/features/admin/hooks/useMyImplementationTasks.ts
git commit -m "feat: add useForScreening, useForImplementation, useMyImplementationTasks hooks"
```

---

### Task 6: ActionCard Component

**Files:**
- Create: `NAFClient/src/features/admin/components/ActionCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// NAFClient/src/features/admin/components/ActionCard.tsx
interface ActionCardProps {
  employeeName: string;
  resourceName: string;
  nafReference: string;
  dateNeeded?: string | null;
  badge?: React.ReactNode;
  actions: React.ReactNode;
}

export function ActionCard({
  employeeName,
  resourceName,
  nafReference,
  dateNeeded,
  badge,
  actions,
}: ActionCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{employeeName}</span>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">{resourceName}</p>
        <p className="text-xs text-muted-foreground">
          {nafReference}
          {dateNeeded &&
            ` · Needed by ${new Date(dateNeeded).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/admin/components/ActionCard.tsx
git commit -m "feat: add ActionCard shared component"
```

---

### Task 7: ForScreeningSection Component

**Files:**
- Create: `NAFClient/src/features/admin/components/ForScreeningSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// NAFClient/src/features/admin/components/ForScreeningSection.tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { claimScreeningStep } from "@/features/naf/api";
import { ActionCard } from "./ActionCard";
import { useForScreening } from "../hooks/useForScreening";

interface ForScreeningSectionProps {
  locationId: number | null;
  currentEmployeeId: string;
}

export function ForScreeningSection({
  locationId,
  currentEmployeeId,
}: ForScreeningSectionProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data = [], isLoading } = useForScreening(locationId);

  const unassigned = data.filter((item) => item.stepClaimedBy === null);
  const myTasks = data.filter(
    (item) => item.stepClaimedBy === currentEmployeeId,
  );
  const total = unassigned.length + myTasks.length;

  const claim = useMutation({
    mutationFn: (stepId: string) => claimScreeningStep(stepId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "for-screening", locationId],
      });
      toast.success("Screening step claimed");
    },
    onError: () => toast.error("Failed to claim step"),
  });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold">
        For Screening
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          · {isLoading ? "…" : total}
        </span>
      </h2>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Unassigned
        </p>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unassigned screening requests.
          </p>
        ) : (
          unassigned.map((item) => (
            <ActionCard
              key={item.resourceRequestId}
              employeeName={item.employeeName}
              resourceName={item.resourceName}
              nafReference={item.nafReference}
              dateNeeded={item.dateNeeded}
              actions={
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={claim.isPending}
                  onClick={() => claim.mutate(item.currentStepId)}
                >
                  Claim
                </Button>
              }
            />
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          My Tasks
        </p>
        {myTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No screening tasks assigned to you.
          </p>
        ) : (
          myTasks.map((item) => (
            <ActionCard
              key={item.resourceRequestId}
              employeeName={item.employeeName}
              resourceName={item.resourceName}
              nafReference={item.nafReference}
              dateNeeded={item.dateNeeded}
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/NAF/${item.nafId}`)}
                >
                  View NAF
                </Button>
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd NAFClient && npm run build 2>&1 | grep -i "ForScreeningSection"
```

Expected: no errors referencing `ForScreeningSection.tsx`.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/components/ForScreeningSection.tsx
git commit -m "feat: add ForScreeningSection component"
```

---

### Task 8: ForImplementationSection Component

**Files:**
- Create: `NAFClient/src/features/admin/components/ForImplementationSection.tsx`

- [ ] **Step 1: Create the component**

```tsx
// NAFClient/src/features/admin/components/ForImplementationSection.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImplementationStatus } from "@/shared/types/enum/status";
import { Progress } from "@/shared/types/enum/progress";
import type { NAF, ResourceRequest } from "@/shared/types/api/naf";
import { DelayedReasonModal } from "@/features/naf/components/DelayedReasonModal";
import { adminApi } from "../api";
import { ActionCard } from "./ActionCard";
import { useForImplementation } from "../hooks/useForImplementation";
import { useMyImplementationTasks } from "../hooks/useMyImplementationTasks";

interface ForImplementationSectionProps {
  locationId: number | null;
}

type FlatItem = {
  nafId: string;
  nafReference: string;
  employeeName: string;
  rr: ResourceRequest;
};

function flattenNAFs(nafs: NAF[]): FlatItem[] {
  return nafs.flatMap((naf) =>
    naf.resourceRequests
      .filter(
        (rr) => (rr.progress as unknown as Progress) === Progress.IMPLEMENTATION,
      )
      .map((rr) => ({
        nafId: naf.id,
        nafReference: naf.reference,
        employeeName:
          `${naf.employee.firstName} ${naf.employee.lastName}`.trim(),
        rr,
      })),
  );
}

function implStatusBadge(status: ImplementationStatus) {
  if (status === ImplementationStatus.IN_PROGRESS)
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
        In Progress
      </span>
    );
  if (status === ImplementationStatus.DELAYED)
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        Delayed
      </span>
    );
  return null;
}

export function ForImplementationSection({
  locationId,
}: ForImplementationSectionProps) {
  const qc = useQueryClient();
  const { data: forImplNafs = [] } = useForImplementation(locationId);
  const { data: myTaskNafs = [] } = useMyImplementationTasks();

  const [delayTarget, setDelayTarget] = useState<string | null>(null);

  const unassigned = flattenNAFs(forImplNafs).filter(
    ({ rr }) => !rr.implementation || !rr.implementation.employeeId,
  );
  const myTasks = flattenNAFs(myTaskNafs);
  const total = unassigned.length + myTasks.length;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "for-implementation"] });
    qc.invalidateQueries({ queryKey: ["admin", "my-implementation-tasks"] });
  };

  const assignToMe = useMutation({
    mutationFn: (resourceRequestId: string) =>
      adminApi.assignToMe(resourceRequestId),
    onSuccess: () => {
      invalidate();
      toast.success("Task claimed");
    },
    onError: () => toast.error("Failed to claim task"),
  });

  const setToInProgress = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToInProgress(implementationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "my-implementation-tasks"] });
      toast.success("Set to In Progress");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToDelayed = useMutation({
    mutationFn: ({
      implementationId,
      delayReason,
    }: {
      implementationId: string;
      delayReason: string;
    }) => adminApi.setToDelayed(implementationId, delayReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "my-implementation-tasks"] });
      toast.success("Marked as Delayed");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const setToAccomplished = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      invalidate();
      toast.success("Marked as Accomplished");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const isSubmitting =
    assignToMe.isPending ||
    setToInProgress.isPending ||
    setToDelayed.isPending ||
    setToAccomplished.isPending;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold">
        For Implementation
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          · {total}
        </span>
      </h2>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Unassigned
        </p>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unassigned implementation requests.
          </p>
        ) : (
          unassigned.map(({ nafId, nafReference, employeeName, rr }) => (
            <ActionCard
              key={rr.id}
              employeeName={employeeName}
              resourceName={rr.resource.name}
              nafReference={nafReference}
              dateNeeded={rr.dateNeeded}
              actions={
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={isSubmitting}
                  onClick={() => assignToMe.mutate(rr.id)}
                >
                  Claim
                </Button>
              }
            />
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          My Tasks
        </p>
        {myTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No implementation tasks assigned to you.
          </p>
        ) : (
          myTasks.map(({ nafReference, employeeName, rr }) => {
            const status =
              rr.implementation?.status ?? ImplementationStatus.OPEN;
            return (
              <ActionCard
                key={rr.id}
                employeeName={employeeName}
                resourceName={rr.resource.name}
                nafReference={nafReference}
                dateNeeded={rr.dateNeeded}
                badge={implStatusBadge(status)}
                actions={
                  <>
                    {status === ImplementationStatus.IN_PROGRESS && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          disabled={isSubmitting}
                          onClick={() =>
                            setToAccomplished.mutate(rr.implementation!.id)
                          }
                        >
                          Mark Accomplished
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                          disabled={isSubmitting}
                          onClick={() => setDelayTarget(rr.implementation!.id)}
                        >
                          Mark Delayed
                        </Button>
                      </>
                    )}
                    {status === ImplementationStatus.DELAYED && (
                      <>
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          disabled={isSubmitting}
                          onClick={() =>
                            setToInProgress.mutate(rr.implementation!.id)
                          }
                        >
                          Back to In Progress
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          disabled={isSubmitting}
                          onClick={() =>
                            setToAccomplished.mutate(rr.implementation!.id)
                          }
                        >
                          Mark Accomplished
                        </Button>
                      </>
                    )}
                  </>
                }
              />
            );
          })
        )}
      </div>

      <DelayedReasonModal
        open={delayTarget !== null}
        onOpenChange={(open) => { if (!open) setDelayTarget(null); }}
        onConfirm={(reason) => {
          if (delayTarget)
            setToDelayed.mutate({
              implementationId: delayTarget,
              delayReason: reason,
            });
          setDelayTarget(null);
        }}
        isSubmitting={setToDelayed.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd NAFClient && npm run build 2>&1 | grep -i "ForImplementationSection"
```

Expected: no errors referencing `ForImplementationSection.tsx`.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/admin/components/ForImplementationSection.tsx
git commit -m "feat: add ForImplementationSection component"
```

---

### Task 9: Wire Up AdminResourceRequestsPage

**Files:**
- Modify: `NAFClient/src/features/admin/pages/AdminResourceRequestsPage.tsx`

- [ ] **Step 1: Replace the page file**

```tsx
// NAFClient/src/features/admin/pages/AdminResourceRequestsPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { DataTable } from "@/shared/components/ui/datatable";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useAdminResourceRequests } from "../hooks/useAdminResourceRequests";
import { resourceRequestColumns } from "../components/resourceRequestColumns";
import { useAuth } from "@/features/auth/AuthContext";
import { ForScreeningSection } from "../components/ForScreeningSection";
import { ForImplementationSection } from "../components/ForImplementationSection";
import type { AdminResourceRequestDTO } from "../types";

const PROGRESS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "For Screening", value: "FOR_SCREENING" },
  { label: "Implementation", value: "IMPLEMENTATION" },
  { label: "Accomplished", value: "ACCOMPLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

export default function AdminResourceRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.locationId ?? null;
  const employeeId = user?.employeeId ?? "";

  const [progress, setProgress] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { query } = useAdminResourceRequests(locationId, progress, page);
  const result = query.data;

  const handleProgressChange = (value: string) => {
    setProgress(value);
    setPage(1);
  };

  const handleRowClick = (row: AdminResourceRequestDTO) => {
    navigate(`/admin/NAF/${row.nafId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-amber-500">Resource Requests</h1>

        <ForScreeningSection
          locationId={locationId}
          currentEmployeeId={employeeId}
        />

        <ForImplementationSection locationId={locationId} />

        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {PROGRESS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleProgressChange(tab.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  progress === tab.value
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <DataTable
            columns={resourceRequestColumns}
            data={result?.data ?? []}
            isLoading={query.isLoading}
            onRowClick={handleRowClick}
            emptyMessage="No resource requests found."
          />

          <TablePagination
            currentPage={result?.currentPage ?? 1}
            totalPages={result?.totalPages ?? 1}
            totalCount={result?.totalCount ?? 0}
            pageSize={result?.pageSize ?? 10}
            onPageChange={setPage}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Full type-check**

```bash
cd NAFClient && npm run build
```

Expected: `built in Xs` with no TypeScript errors.

- [ ] **Step 3: Start the dev server and verify visually**

```bash
cd NAFClient && npm run dev
```

Open `http://localhost:5173` and navigate to the admin Resource Requests page. Verify:
- "For Screening" section appears with Unassigned and My Tasks sub-sections
- "For Implementation" section appears with Unassigned and My Tasks sub-sections
- Each sub-section shows a compact empty state when there are no items
- The existing status tabs and table still work as before

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/features/admin/pages/AdminResourceRequestsPage.tsx
git commit -m "feat: mount ForScreeningSection and ForImplementationSection on resource requests page"
```
