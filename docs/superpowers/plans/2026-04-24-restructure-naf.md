# NAF Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate NAF API calls into `features/naf/api.ts`, decompose the three oversized files (`resourceRequestAccordion.tsx` → 8 files, `addResourceDialog.tsx` → 6 files, `ViewNAFDetail.tsx` → 3 files), and add a barrel `index.ts`.

**Architecture:** Feature-by-feature Approach C. Tasks run in order: API layer first (so hooks compile), then component decompositions (largest risk, each verified independently), then page split, then cleanup. No logic changes — only file splits and import path updates.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, ShadCN, TanStack React Query, sonner

**Prerequisite:** Run this plan AFTER both `2026-04-24-restructure-shared.md` and `2026-04-24-restructure-auth.md` are complete.

---

## File Map

### New files created

| New path                                                                        | Source                                                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/features/naf/api.ts`                                                       | content from `nafService.ts` + `resourceRequestService.ts` |
| `src/features/naf/components/resource-request/resourceRequestUtils.tsx`         | extracted from `resourceRequestAccordion.tsx`              |
| `src/features/naf/components/resource-request/ResourceRequestContent.tsx`       | extracted from `resourceRequestAccordion.tsx`              |
| `src/features/naf/components/resource-request/ResourceRequestActions.tsx`       | extracted from `resourceRequestAccordion.tsx`              |
| `src/features/naf/components/resource-request/ApproveDialog.tsx`                | extracted from `resourceRequestAccordion.tsx`              |
| `src/features/naf/components/resource-request/RejectDialog.tsx`                 | extracted from `resourceRequestAccordion.tsx`              |
| `src/features/naf/components/resource-request/ChangeResourceDialog.tsx`         | extracted from `resourceRequestAccordion.tsx`              |
| `src/features/naf/components/resource-request/ResourceRequestAccordionItem.tsx` | extracted from `resourceRequestAccordion.tsx`              |
| `src/features/naf/components/resource-request/index.ts`                         | new                                                        |
| `src/shared/components/common/SearchableCombobox.tsx`                           | extracted from `addResourceDialog.tsx`                     |
| `src/features/naf/components/add-resource/BasicResourceSection.tsx`             | extracted from `addResourceDialog.tsx`                     |
| `src/features/naf/components/add-resource/InternetEntryCard.tsx`                | extracted from `addResourceDialog.tsx`                     |
| `src/features/naf/components/add-resource/GroupEmailEntryCard.tsx`              | extracted from `addResourceDialog.tsx`                     |
| `src/features/naf/components/add-resource/SharedFolderEntryCard.tsx`            | extracted from `addResourceDialog.tsx`                     |
| `src/features/naf/components/add-resource/AddResourceDialog.tsx`                | extracted from `addResourceDialog.tsx`                     |
| `src/features/naf/components/add-resource/index.ts`                             | new                                                        |
| `src/features/naf/components/NAFDetailHeader.tsx`                               | extracted from `ViewNAFDetail.tsx`                         |
| `src/features/naf/components/ResourceRequestList.tsx`                           | extracted from `ViewNAFDetail.tsx`                         |
| `src/features/naf/index.ts`                                                     | new                                                        |

### Files modified

| File                                           | Change                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `src/features/naf/hooks/useNAF.ts`             | import from `../api`                                                   |
| `src/features/naf/hooks/useResourceRequest.ts` | import from `../api`                                                   |
| `src/features/naf/hooks/useAddResource.ts`     | import from `../api` and `@/shared/api/resourceMetadataService`        |
| `src/features/naf/pages/ViewNAFDetail.tsx`     | reduced to orchestrator; imports NAFDetailHeader + ResourceRequestList |
| `src/app/router.tsx`                           | no change needed (lazy imports still resolve)                          |

### Files deleted

| File                                                       |
| ---------------------------------------------------------- |
| `src/features/naf/components/resourceRequestAccordion.tsx` |
| `src/features/naf/components/addResourceDialog.tsx`        |
| `src/services/EntityAPI/nafService.ts`                     |
| `src/services/EntityAPI/resourceRequestService.ts`         |

---

### Task 1: Create `features/naf/api.ts`

**Files:**

- Create: `NAFClient/src/features/naf/api.ts`

- [ ] **Step 1: Write `src/features/naf/api.ts`** (consolidates nafService + resourceRequestService)

```ts
import { api } from "@/shared/api/client";
import type {
  NAF,
  PurposeProps,
  ResourceRequest,
} from "@/shared/types/api/naf";
import type { PagedResult } from "@/shared/types/common/pagedResult";

// ── NAF ──────────────────────────────────────────────────────────────────────

export const getSubordinateNAFs = async (
  employee: string,
  page: number,
): Promise<PagedResult<NAF>> => {
  const res = await api.get(`/NAFs/${employee}/subordinates/`, {
    params: { page },
  });
  if (!res.data) {
    return {
      data: [],
      totalCount: 0,
      pageSize: 6,
      currentPage: page ?? 1,
      totalPages: 0,
    };
  }
  return res.data;
};

export const getApproverNAFs = async (
  employee: string,
  page: number,
): Promise<PagedResult<NAF>> => {
  const res = await api.get(`/NAFs/${employee}/approver`, { params: { page } });
  if (!res.data) {
    return {
      data: [],
      totalCount: 0,
      pageSize: 6,
      currentPage: page ?? 1,
      totalPages: 0,
    };
  }
  return res.data;
};

export const getNAF = async (id: string): Promise<NAF> => {
  const data = (await api.get(`/NAFs/${id}`)).data;
  return data;
};

export const employeeHasNAF = async (
  employeeId: string,
  departmentId: string,
): Promise<boolean> => {
  return (
    await api.get(`/NAFs/hasNAF/${employeeId}/department/${departmentId}`)
  ).data;
};

export const getEmployeeNAFs = async (employeeId: string): Promise<NAF[]> => {
  return (await api.get(`/NAFs/employee/${employeeId}`)).data;
};

export const createNAF = async (payload: {
  employeeId: string;
  requestorId: string;
  hardwareId: number;
  dateNeeded?: string | null;
}) => {
  return (await api.post("/NAFs", payload)).data;
};

export const deactivateNAF = async (id: string) => {
  return (await api.delete(`/NAFs/${id}`)).data;
};

// ── Resource Requests ────────────────────────────────────────────────────────

export const createResourceRequest = async (payload: {
  nafId: string;
  resourceId: number;
  purpose: string;
  additionalInfo: Record<string, unknown>;
  dateNeeded?: string | null;
}): Promise<ResourceRequest> => {
  return (await api.post("/Requests", payload)).data;
};

export const editResourceRequestPurpose = async (
  resourceRequest: string,
  purpose: PurposeProps,
): Promise<ResourceRequest> => {
  return (await api.post(`/Requests/${resourceRequest}/purpose`, purpose)).data;
};

export const changeResource = async (
  resourceRequestId: string,
  resourceId: number,
): Promise<ResourceRequest> => {
  return (
    await api.post(`/Requests/change-resource/${resourceRequestId}`, resourceId)
  ).data;
};

export const deleteResourceRequest = async (
  resourceRequest: string,
): Promise<void> => {
  await api.delete(`/Requests/${resourceRequest}`);
};

export const approveResourceRequest = async (
  stepId: string,
  comment?: string,
): Promise<ResourceRequest> => {
  return (await api.put(`/ApprovalSteps/${stepId}/approve`, comment)).data;
};

export const cancelResourceRequest = async (
  resourceRequestId: string,
): Promise<void> => {
  await api.put(`/Requests/${resourceRequestId}/cancel`);
};

export const rejectResourceRequest = async (
  stepId: string,
  reasonForRejection: string,
): Promise<ResourceRequest> => {
  return (await api.put(`/ApprovalSteps/${stepId}/reject`, reasonForRejection))
    .data;
};
```

- [ ] **Step 2: Update `src/features/naf/hooks/useNAF.ts` — change import to `../api`**

Replace:

```ts
import {
  getSubordinateNAFs,
  getApproverNAFs,
  getNAF,
  getEmployeeNAFs,
  createNAF,
  deactivateNAF,
} from "@/services/EntityAPI/nafService";
```

With:

```ts
import {
  getSubordinateNAFs,
  getApproverNAFs,
  getNAF,
  getEmployeeNAFs,
  createNAF,
  deactivateNAF,
} from "../api";
```

Also update the types import from `@/types/api/naf` → `@/shared/types/api/naf` and `@/types/common/pagedResult` → `@/shared/types/common/pagedResult` if not already done by the shared plan.

- [ ] **Step 3: Update `src/features/naf/hooks/useResourceRequest.ts` — change imports**

Replace:

```ts
import {
  approveResourceRequest,
  cancelResourceRequest,
  changeResource,
  createResourceRequest,
  deleteResourceRequest,
  editResourceRequestPurpose,
  rejectResourceRequest,
} from "@/services/EntityAPI/resourceRequestService";
```

With:

```ts
import {
  approveResourceRequest,
  cancelResourceRequest,
  changeResource,
  createResourceRequest,
  deleteResourceRequest,
  editResourceRequestPurpose,
  rejectResourceRequest,
} from "../api";
```

- [ ] **Step 4: Update `src/features/naf/hooks/useAddResource.ts` — change imports**

Replace:

```ts
import {
  addBasicResourcesToNAF,
  createInternetPurpose,
  createInternetResource,
} from "@/services/EntityAPI/resourceMetadataService";
import { createResourceRequest } from "@/services/EntityAPI/resourceRequestService";
```

With:

```ts
import {
  addBasicResourcesToNAF,
  createInternetPurpose,
  createInternetResource,
} from "@/shared/api/resourceMetadataService";
import { createResourceRequest } from "../api";
```

- [ ] **Step 5: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Delete old service files**

```bash
cd NAFClient
rm src/services/EntityAPI/nafService.ts
rm src/services/EntityAPI/resourceRequestService.ts
```

- [ ] **Step 7: Verify build still passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: consolidate naf API into features/naf/api.ts"
```

---

### Task 2: Extract `SearchableCombobox` to shared

The `SearchableCombobox` component inside `addResourceDialog.tsx` is generic enough to be shared. Extract it before decomposing the dialog.

**Files:**

- Create: `NAFClient/src/shared/components/common/SearchableCombobox.tsx`

- [ ] **Step 1: Write `src/shared/components/common/SearchableCombobox.tsx`**

```tsx
import { useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Command } from "cmdk";
import { ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";

export interface ComboboxOption {
  value: number;
  label: string;
}

export function SearchableCombobox({
  options,
  value,
  onValueChange,
  placeholder,
  disabled,
}: {
  options: ComboboxOption[];
  value: number | null;
  onValueChange: (v: number) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
          disabled={disabled}
          type="button"
        >
          <span className={selected ? "" : "text-muted-foreground"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-1 shadow-md"
          sideOffset={4}
        >
          <Command>
            <div className="flex items-center border-b px-2 pb-1 mb-1">
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No results found
                </p>
              )}
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer",
                    value === o.value && "bg-accent",
                  )}
                  onClick={() => {
                    onValueChange(o.value);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5",
                      value === o.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.label}
                </button>
              ))}
            </div>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: extract SearchableCombobox to shared/components/common/"
```

---

### Task 3: Decompose `resourceRequestAccordion.tsx`

Create the `resource-request/` subfolder with 7 focused files, then delete the original.

**Files:**

- Create: `src/features/naf/components/resource-request/resourceRequestUtils.tsx`
- Create: `src/features/naf/components/resource-request/ResourceRequestContent.tsx`
- Create: `src/features/naf/components/resource-request/ResourceRequestActions.tsx`
- Create: `src/features/naf/components/resource-request/ApproveDialog.tsx`
- Create: `src/features/naf/components/resource-request/RejectDialog.tsx`
- Create: `src/features/naf/components/resource-request/ChangeResourceDialog.tsx`
- Create: `src/features/naf/components/resource-request/ResourceRequestAccordionItem.tsx`
- Create: `src/features/naf/components/resource-request/index.ts`
- Delete: `src/features/naf/components/resourceRequestAccordion.tsx`

- [ ] **Step 1: Write `resource-request/resourceRequestUtils.tsx`**

```tsx
export function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ResourceIcon({
  iconUrl,
  name,
}: {
  iconUrl: string;
  name: string;
}) {
  return (
    <img
      src={iconUrl}
      alt={name}
      className="h-5 w-5 object-contain shrink-0"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

import { ResourceRequestAction } from "@/shared/types/api/naf";

export const ACTION_CONFIG: Record<
  ResourceRequestAction,
  { label: string; className: string }
> = {
  [ResourceRequestAction.APPROVE]: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700",
  },
  [ResourceRequestAction.REJECT]: {
    label: "Rejected",
    className: "bg-red-100 text-red-600",
  },
  [ResourceRequestAction.DELAY]: {
    label: "Delayed",
    className: "bg-yellow-100 text-yellow-700",
  },
  [ResourceRequestAction.ACCEPT]: {
    label: "Accepted",
    className: "bg-blue-100 text-blue-700",
  },
  [ResourceRequestAction.ACCOMPLISH]: {
    label: "Accomplished",
    className: "bg-emerald-100 text-emerald-700",
  },
  [ResourceRequestAction.EDITED]: {
    label: "Edited",
    className: "bg-gray-100 text-gray-600",
  },
  [ResourceRequestAction.CANCELLED]: {
    label: "Cancelled",
    className: "bg-gray-50 border-gray-200",
  },
};
```

- [ ] **Step 2: Write `resource-request/ResourceRequestContent.tsx`**

```tsx
import { Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { getDateUrgency } from "@/shared/utils/dateUrgency";
import type {
  ResourceRequest,
  ResourceRequestHistory,
} from "@/shared/types/api/naf";
import { ResourceRequestAction } from "@/shared/types/api/naf";
import { ImplementationStatus } from "@/shared/types/enum/status";
import { Progress } from "@/shared/types/enum/progress";
import {
  ACTION_CONFIG,
  formatDateTime,
  ResourceIcon,
} from "./resourceRequestUtils";

export function ActionBadge({ type }: { type: ResourceRequestAction }) {
  const cfg = ACTION_CONFIG[type];
  return (
    <span
      className={cn(
        "text-xs font-semibold px-2 py-0.5 rounded-full",
        cfg?.className ?? "bg-gray-100 text-gray-600",
      )}
    >
      {cfg?.label ?? String(type)}
    </span>
  );
}

export function DateUrgencyBadge({
  dateNeeded,
}: {
  dateNeeded?: string | null;
}) {
  const urgency = getDateUrgency(dateNeeded);
  if (!urgency) return null;
  return (
    <span
      className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
        urgency.overdue
          ? "bg-red-100 text-red-700"
          : "bg-amber-50 text-amber-700",
      )}
    >
      {urgency.label}
    </span>
  );
}

export function HistoryTable({
  histories,
}: {
  histories: ResourceRequestHistory[];
}) {
  if (histories.length === 0) return null;
  const sorted = [...histories].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold text-sm">History</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs font-semibold">
              Date and Time
            </TableHead>
            <TableHead className="text-xs font-semibold">Action</TableHead>
            <TableHead className="text-xs font-semibold">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDateTime(h.createdAt)}
              </TableCell>
              <TableCell>
                <ActionBadge type={h.type} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {h.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdditionalInfoBlock({
  info,
}: {
  info: NonNullable<ResourceRequest["additionalInfo"]>;
}) {
  if (info.type === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Access</p>
        <Select value={info.resource} disabled>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={info.resource}>{info.resource}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (info.type === 1) {
    return (
      <div className="text-sm space-y-1">
        <p className="font-semibold">Shared Folder</p>
        <p className="text-muted-foreground">{info.name}</p>
      </div>
    );
  }
  if (info.type === 2) {
    return (
      <div className="text-sm space-y-1">
        <p className="font-semibold">Group Email</p>
        <p className="text-muted-foreground">{info.email}</p>
      </div>
    );
  }
  return null;
}

export function PurposeBlock({
  request,
  onShowHistory,
}: {
  request: ResourceRequest;
  onShowHistory: () => void;
}) {
  const purpose = request.purposes?.[request.purposes.length - 1]?.purpose;
  const hasPurposeHistory = (request.purposes?.length ?? 0) > 1;
  return (
    <div className="space-y-3">
      {request.dateNeeded && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Date Needed</p>
          <p className="text-sm font-medium">
            {new Date(request.dateNeeded).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}
      {request.progress == Progress.ACCOMPLISHED && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">
            Accomplished At
          </p>
          <p className="text-sm font-medium">
            {formatDateTime(request.accomplishedAt)}
          </p>
        </div>
      )}
      {purpose && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold">Purpose</p>
            {hasPurposeHistory && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7"
                onClick={onShowHistory}
              >
                <History className="h-3 w-3" />
                Purpose History
              </Button>
            )}
          </div>
          <Textarea
            readOnly
            value={purpose}
            className="resize-none text-sm bg-background"
            rows={3}
          />
        </div>
      )}
      {request.additionalInfo && (
        <AdditionalInfoBlock info={request.additionalInfo} />
      )}
    </div>
  );
}

export function ImplementationBlock({
  impl,
}: {
  impl: ResourceRequest["implementation"];
}) {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Implementation
      </p>
      {!impl || impl.status === ImplementationStatus.OPEN ? (
        <div className="rounded-md border border-dashed p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            Unassigned
          </span>
          <p className="text-sm text-muted-foreground">
            Not yet accepted by a technical team member.
          </p>
        </div>
      ) : impl.status === ImplementationStatus.IN_PROGRESS ? (
        <div className="rounded-md bg-blue-50 border border-blue-100 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            In Progress
          </span>
          {impl.employeeId && (
            <p className="text-sm">
              Assigned to:{" "}
              <span className="font-medium">{impl.employeeId}</span>
            </p>
          )}
          {impl.acceptedAt && (
            <p className="text-xs text-muted-foreground">
              Accepted: {formatDateTime(impl.acceptedAt)}
            </p>
          )}
        </div>
      ) : impl.status === ImplementationStatus.DELAYED ? (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
            Delayed
          </span>
          {impl.employeeId && (
            <p className="text-sm">
              Assigned to:{" "}
              <span className="font-medium">{impl.employeeId}</span>
            </p>
          )}
          {impl.delayedAt && (
            <p className="text-xs text-muted-foreground">
              Delayed at: {formatDateTime(impl.delayedAt)}
            </p>
          )}
          {impl.delayReason && (
            <div>
              <p className="text-xs font-semibold text-yellow-700 mb-0.5">
                Reason for delay
              </p>
              <p className="text-sm text-muted-foreground">
                {impl.delayReason}
              </p>
            </div>
          )}
        </div>
      ) : impl.status === ImplementationStatus.ACCOMPLISHED ? (
        <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3 space-y-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
            Accomplished
          </span>
          {impl.employeeId && (
            <p className="text-sm">
              Implemented by:{" "}
              <span className="font-medium">{impl.employeeId}</span>
            </p>
          )}
          {impl.accomplishedAt && (
            <p className="text-xs text-muted-foreground">
              Accomplished: {formatDateTime(impl.accomplishedAt)}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { ResourceIcon, DateUrgencyBadge };
```

- [ ] **Step 3: Write `resource-request/ResourceRequestActions.tsx`**

```tsx
import { Pencil, Trash2, RotateCcw, BellRing, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import { formatDateTime } from "./resourceRequestUtils";

export function OpenActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        size="sm"
        className="bg-emerald-400 hover:bg-emerald-500 text-white gap-1.5"
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Button>
      <Button
        size="sm"
        className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </Button>
    </div>
  );
}

export function ReminderAction({ onRemind }: { onRemind: () => void }) {
  return (
    <div className="flex justify-end mt-4">
      <Button
        size="sm"
        variant="outline"
        className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 gap-1.5"
        onClick={onRemind}
      >
        Remind Technical Team <BellRing className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function DeactivateAction({
  onDeactivate,
}: {
  onDeactivate: () => void;
}) {
  return (
    <div className="flex justify-end mt-4">
      <Button
        size="sm"
        className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
        onClick={onDeactivate}
      >
        Deactivate Access <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function RejectedActions({
  onResubmit,
  onCancel,
}: {
  rejectionReason?: string;
  onResubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 gap-1.5"
          onClick={onResubmit}
        >
          Resubmit <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
          onClick={onCancel}
        >
          Cancel Request <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function CancelledBadge({ cancelledAt }: { cancelledAt: string }) {
  return (
    <div className="mt-4 rounded-md bg-gray-50 border border-gray-200 p-3 space-y-0.5">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
        Cancelled
      </span>
      <p className="text-xs text-muted-foreground pt-1">
        Cancelled on {formatDateTime(cancelledAt)}
      </p>
    </div>
  );
}

export function ApproverActions({
  onApprove,
  onReject,
}: {
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        size="sm"
        className="bg-emerald-400 hover:bg-emerald-500 text-white gap-1.5 min-w-[90px]"
        onClick={onApprove}
      >
        Approve <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="sm"
        className="bg-red-400 hover:bg-red-500 text-white gap-1.5 min-w-[90px]"
        onClick={onReject}
      >
        Reject <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Write `resource-request/ApproveDialog.tsx`**

```tsx
import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ApproveDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (remarks: string) => void;
  isSubmitting?: boolean;
}) {
  const [remarks, setRemarks] = useState("");

  const handleOpenChange = (val: boolean) => {
    if (!val) setRemarks("");
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-600">
            Approve Request
          </DialogTitle>
          <DialogDescription>
            You are about to approve this resource request. You may optionally
            add remarks before submitting.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="approve-remarks" className="text-sm font-semibold">
            Remarks{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            id="approve-remarks"
            placeholder="Add any remarks here..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5"
            onClick={() => {
              onConfirm(remarks);
              setRemarks("");
            }}
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4" />{" "}
            {isSubmitting ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: Write `resource-request/RejectDialog.tsx`**

```tsx
import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/utils/utils";

export function RejectDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const isInvalid = touched && reason.trim() === "";

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setReason("");
      setTouched(false);
    }
    onOpenChange(val);
  };

  const handleConfirm = () => {
    setTouched(true);
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason("");
    setTouched(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-500">Reject Request</DialogTitle>
          <DialogDescription>
            A reason for rejection is required before submitting.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="reject-reason" className="text-sm font-semibold">
            Reason for Rejection <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="reject-reason"
            placeholder="State the reason for rejection..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (touched) setTouched(false);
            }}
            onBlur={() => setTouched(true)}
            className={cn(
              "resize-none",
              isInvalid && "border-red-400 focus-visible:ring-red-400",
            )}
            rows={3}
          />
          {isInvalid && (
            <p className="text-xs text-red-500">
              Reason for rejection is required.
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-400 hover:bg-red-500 text-white gap-1.5"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" /> {isSubmitting ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: Write `resource-request/ChangeResourceDialog.tsx`**

```tsx
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import type { Resource } from "@/shared/types/api/naf";
import { ResourceIcon } from "./resourceRequestUtils";

export function ChangeResourceDialog({
  open,
  onOpenChange,
  currentResourceName,
  availableResources,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentResourceName: string;
  availableResources: Resource[];
  onConfirm: (resourceId: number) => void;
  isSubmitting?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleOpenChange = (val: boolean) => {
    if (!val) setSelectedId(null);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-600">Change Resource</DialogTitle>
          <DialogDescription>
            Replacing:{" "}
            <span className="font-medium text-foreground">
              {currentResourceName}
            </span>
            . The original request will be cancelled.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {availableResources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other resources available in this group.
            </p>
          ) : (
            <div className="space-y-1.5">
              {availableResources.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={cn(
                    "flex items-center gap-3 w-full rounded-md border px-3 py-2 text-sm transition-colors text-left",
                    selectedId === r.id
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => setSelectedId(r.id)}
                >
                  <ResourceIcon iconUrl={r.iconUrl} name={r.name} />
                  <span>{r.name}</span>
                  {r.isSpecial && (
                    <span className="ml-auto text-xs text-amber-600 font-medium">
                      Requires Approval
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
            onClick={() => {
              if (selectedId !== null) {
                onConfirm(selectedId);
                setSelectedId(null);
              }
            }}
            disabled={selectedId === null || isSubmitting}
          >
            <ArrowLeftRight className="h-4 w-4" />{" "}
            {isSubmitting ? "Changing..." : "Confirm Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 7: Write `resource-request/ResourceRequestAccordionItem.tsx`**

```tsx
import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/utils/utils";
import { getDateUrgency } from "@/shared/utils/dateUrgency";
import type {
  Resource,
  ResourceGroup,
  ResourceRequest,
  PurposeProps,
} from "@/shared/types/api/naf";
import { Status } from "@/shared/types/enum/status";
import { Progress } from "@/shared/types/enum/progress";
import { PROGRESS_CONFIG } from "../progressBadge";
import { PurposeHistoryModal } from "../purposeHistoryModal";
import { DeleteConfirmDialog } from "../deleteConfirmDialog";
import { ResubmitDialog } from "../resubmitDialog";
import { ResourceIcon, DateUrgencyBadge } from "./resourceRequestUtils";
import {
  PurposeBlock,
  HistoryTable,
  ImplementationBlock,
} from "./ResourceRequestContent";
import {
  OpenActions,
  ReminderAction,
  DeactivateAction,
  RejectedActions,
  CancelledBadge,
  ApproverActions,
} from "./ResourceRequestActions";
import { ApproveDialog } from "./ApproveDialog";
import { RejectDialog } from "./RejectDialog";
import { ChangeResourceDialog } from "./ChangeResourceDialog";

interface ResourceRequestAccordionItemProps {
  request: ResourceRequest;
  isCurrentApprover: boolean;
  isRequestor: boolean;
  isApprover: boolean;
  isSubmitting?: boolean;
  resourceGroup?: ResourceGroup;
  groupResources?: Resource[];
  onEdit: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onDelete: (requestId: string) => void;
  onRemind: (requestId: string) => void;
  onDeactivate: (requestId: string) => void;
  onResubmit: (requestId: string, nafId: string, purpose: PurposeProps) => void;
  onCancel: (requestId: string) => void;
  onChangeResource: (requestId: string, newResourceId: number) => void;
  onApprove: (requestId: string, remarks: string) => void;
  onReject: (requestId: string, reasonForRejection: string) => void;
}

export function ResourceRequestAccordionItem({
  request,
  isCurrentApprover = false,
  isApprover,
  isRequestor,
  isSubmitting,
  resourceGroup,
  groupResources = [],
  onEdit,
  onDelete,
  onRemind,
  onDeactivate,
  onResubmit,
  onCancel,
  onChangeResource,
  onApprove,
  onReject,
}: ResourceRequestAccordionItemProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [purposeHistoryOpen, setPurposeHistoryOpen] = useState(false);
  const [changeResourceDialogOpen, setChangeResourceDialogOpen] =
    useState(false);

  const progress = request.progress as unknown as Progress;
  const config = PROGRESS_CONFIG[progress];
  const urgency = getDateUrgency(request.dateNeeded);
  const purposeIndex = request.purposes ? request.purposes.length - 1 : 0;
  const initialPurpose = request.purposes?.[purposeIndex]?.purpose ?? "";

  const rejectionHistory = request.steps
    .flatMap((s) => s.histories)
    .filter((h) => h.status === Status.REJECTED)
    .sort(
      (a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime(),
    )[0];
  const rejectionReason = rejectionHistory?.reasonForRejection;

  const showHistory = progress !== Progress.OPEN;

  const canChangeResource =
    !isCurrentApprover &&
    !isApprover &&
    (resourceGroup?.canChangeWithoutApproval ?? false) &&
    groupResources.length > 0;

  return (
    <>
      <AccordionItem
        value={request.id}
        className={cn(
          "border rounded-lg px-0 overflow-hidden",
          urgency?.overdue && "border-red-300 bg-red-50/30",
        )}
      >
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ResourceIcon
              iconUrl={request.resource.iconUrl}
              name={request.resource.name}
            />
            <span className="text-sm font-medium truncate">
              {request.resource.name}
            </span>
            {progress != Progress.ACCOMPLISHED &&
              progress != Progress.NOT_ACCOMPLISHED && (
                <DateUrgencyBadge dateNeeded={request.dateNeeded} />
              )}
          </div>
          <span
            className={cn(
              "text-sm font-semibold mr-2 shrink-0",
              config?.className
                .split(" ")
                .filter((c) => c.startsWith("text-"))
                .join(" "),
            )}
          >
            {config?.label ?? String(progress)}
          </span>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4 pt-2">
          <PurposeBlock
            request={request}
            onShowHistory={() => setPurposeHistoryOpen(true)}
          />
          {showHistory && <HistoryTable histories={request.histories} />}
          {progress === Progress.REJECTED && (
            <div>
              <p className="text-sm font-semibold text-red-500 mb-1">
                Reason for Rejection
              </p>
              <Textarea
                readOnly
                value={rejectionReason}
                className="resize-none text-sm bg-background border-red-200"
                rows={2}
              />
            </div>
          )}
          {progress === Progress.IMPLEMENTATION && (
            <ImplementationBlock impl={request.implementation} />
          )}

          {isApprover && isCurrentApprover && (
            <>
              {(progress === Progress.OPEN ||
                progress === Progress.IN_PROGRESS) && (
                <ApproverActions
                  onApprove={() => setApproveDialogOpen(true)}
                  onReject={() => setRejectDialogOpen(true)}
                />
              )}
              {progress === Progress.IMPLEMENTATION && (
                <ReminderAction onRemind={() => onRemind(request.id)} />
              )}
            </>
          )}

          {!isCurrentApprover && !isApprover && (
            <>
              {progress === Progress.OPEN && (
                <OpenActions
                  onEdit={() => setEditDialogOpen(true)}
                  onDelete={() => setDeleteDialogOpen(true)}
                />
              )}
              {progress === Progress.ACCOMPLISHED && isRequestor && (
                <DeactivateAction
                  onDeactivate={() => onDeactivate(request.id)}
                />
              )}
              {progress === Progress.REJECTED &&
                (request.cancelledAt ? (
                  <CancelledBadge cancelledAt={request.cancelledAt} />
                ) : (
                  <RejectedActions
                    rejectionReason={rejectionReason}
                    onResubmit={() => setResubmitDialogOpen(true)}
                    onCancel={() => onCancel(request.id)}
                  />
                ))}
              {progress === Progress.IMPLEMENTATION && (
                <ReminderAction onRemind={() => onRemind(request.id)} />
              )}
              {canChangeResource &&
                progress !== Progress.ACCOMPLISHED &&
                progress !== Progress.NOT_ACCOMPLISHED &&
                !request.cancelledAt && (
                  <div className="flex justify-end mt-4">
                    <Button
                      size="sm"
                      className="bg-amber-400 hover:bg-amber-500 text-white gap-1.5"
                      onClick={() => setChangeResourceDialogOpen(true)}
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" /> Change Resource
                    </Button>
                  </div>
                )}
            </>
          )}
        </AccordionContent>
      </AccordionItem>

      <PurposeHistoryModal
        open={purposeHistoryOpen}
        onOpenChange={setPurposeHistoryOpen}
        purposes={request.purposes ?? []}
        steps={request.steps ?? []}
      />
      <ResubmitDialog
        open={resubmitDialogOpen}
        onOpenChange={setResubmitDialogOpen}
        initialPurpose={initialPurpose}
        onSubmit={(purpose) => {
          onResubmit(request.id, request.nafId, { ...purpose });
          setResubmitDialogOpen(false);
        }}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        resourceName={request.resource.name}
        onConfirm={() => {
          onDelete(request.id);
          setDeleteDialogOpen(false);
        }}
      />
      <ApproveDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        onConfirm={(remarks) => {
          onApprove(request.id, remarks);
          setApproveDialogOpen(false);
        }}
        isSubmitting={isSubmitting}
      />
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={(reason) => {
          onReject(request.id, reason);
          setRejectDialogOpen(false);
        }}
        isSubmitting={isSubmitting}
      />
      <ChangeResourceDialog
        open={changeResourceDialogOpen}
        onOpenChange={setChangeResourceDialogOpen}
        currentResourceName={request.resource.name}
        availableResources={groupResources}
        onConfirm={(newResourceId) => {
          onChangeResource(request.id, newResourceId);
          setChangeResourceDialogOpen(false);
        }}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
```

- [ ] **Step 8: Write `resource-request/index.ts`**

```ts
export { ResourceRequestAccordionItem } from "./ResourceRequestAccordionItem";
```

- [ ] **Step 9: Update the import in `ViewNAFDetail.tsx`**

Replace:

```ts
import { ResourceRequestAccordionItem } from "@/features/naf/components/resourceRequestAccordion";
```

With:

```ts
import { ResourceRequestAccordionItem } from "@/features/naf/components/resource-request";
```

- [ ] **Step 10: Delete the original file**

```bash
cd NAFClient && rm src/features/naf/components/resourceRequestAccordion.tsx
```

- [ ] **Step 11: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 12: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: decompose resourceRequestAccordion into resource-request/ subfolder"
```

---

### Task 4: Decompose `addResourceDialog.tsx`

**Files:**

- Create: `src/features/naf/components/add-resource/BasicResourceSection.tsx`
- Create: `src/features/naf/components/add-resource/InternetEntryCard.tsx`
- Create: `src/features/naf/components/add-resource/GroupEmailEntryCard.tsx`
- Create: `src/features/naf/components/add-resource/SharedFolderEntryCard.tsx`
- Create: `src/features/naf/components/add-resource/AddResourceDialog.tsx`
- Create: `src/features/naf/components/add-resource/index.ts`
- Delete: `src/features/naf/components/addResourceDialog.tsx`

- [ ] **Step 1: Write `add-resource/BasicResourceSection.tsx`**

```tsx
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";
import type { Resource } from "@/shared/types/api/naf";
import type { BasicResourceWithDate } from "../../hooks/useAddResource";

interface BasicResourceSectionProps {
  availableBasic: Resource[];
  basicResources: BasicResourceWithDate[];
  onChange: (updated: BasicResourceWithDate[]) => void;
}

export function BasicResourceSection({
  availableBasic,
  basicResources,
  onChange,
}: BasicResourceSectionProps) {
  if (availableBasic.length === 0) return null;

  return (
    <section className="space-y-2">
      <p className="text-sm font-semibold text-amber-500">BASIC RESOURCES</p>
      <div className="flex flex-col gap-2">
        {availableBasic.map((r) => {
          const entry = basicResources.find((b) => b.id === r.id);
          const isChecked = !!entry;
          return (
            <div key={r.id} className="border rounded-md p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`basic-${r.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([
                        ...basicResources,
                        { id: r.id, dateNeeded: "" },
                      ]);
                    } else {
                      onChange(basicResources.filter((b) => b.id !== r.id));
                    }
                  }}
                />
                <FieldLabel htmlFor={`basic-${r.id}`}>{r.name}</FieldLabel>
              </div>
              {isChecked && (
                <input
                  type="date"
                  value={entry!.dateNeeded}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    onChange(
                      basicResources.map((b) =>
                        b.id === r.id
                          ? { ...b, dateNeeded: e.target.value }
                          : b,
                      ),
                    )
                  }
                  className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write `add-resource/InternetEntryCard.tsx`**

```tsx
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { Select as SelectPrimitive } from "radix-ui";
import { SearchableCombobox } from "@/shared/components/common/SearchableCombobox";
import type { InternetEntry } from "../../hooks/useAddResource";

const OTHER_SENTINEL = "__other__";

interface InternetEntryCardProps {
  entry: InternetEntry;
  allInternetResources: { id: number; name: string; purposeId: number }[];
  allInternetPurposes: { id: number; name: string }[];
  usedInternetResourceIds: number[];
  onChange: (patch: Partial<InternetEntry>) => void;
  onRemove: () => void;
}

export function InternetEntryCard({
  entry,
  allInternetResources,
  allInternetPurposes,
  usedInternetResourceIds,
  onChange,
  onRemove,
}: InternetEntryCardProps) {
  const availablePurposeIds = Array.from(
    new Set(
      allInternetResources
        .filter((r) => !usedInternetResourceIds.includes(r.id))
        .map((r) => r.purposeId),
    ),
  );

  const resourcesForPurpose = allInternetResources.filter(
    (r) =>
      r.purposeId === entry.internetPurposeId &&
      !usedInternetResourceIds.includes(r.id),
  );

  const purposeSelectValue = entry.isOther
    ? OTHER_SENTINEL
    : (entry.internetPurposeId?.toString() ?? "");

  const handlePurposeChange = (v: string) => {
    if (v === OTHER_SENTINEL) {
      onChange({
        isOther: true,
        internetPurposeId: null,
        internetResourceId: null,
      });
    } else {
      onChange({
        isOther: false,
        internetPurposeId: Number(v),
        internetResourceId: null,
        newPurposeName: "",
        newPurposeDescription: "",
        newResourceName: "",
        newResourceUrl: "",
        newResourceDescription: "",
      });
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-1">
        <FieldLabel>Purpose Category</FieldLabel>
        <SelectPrimitive.Root
          value={purposeSelectValue}
          onValueChange={handlePurposeChange}
        >
          <SelectPrimitive.Trigger className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
            <SelectPrimitive.Value placeholder="Select purpose category" />
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
              <SelectPrimitive.Viewport className="p-1">
                {availablePurposeIds.map((purposeId) => {
                  const purpose = allInternetPurposes.find(
                    (p) => p.id === purposeId,
                  );
                  return (
                    <SelectPrimitive.Item
                      key={purposeId}
                      value={purposeId.toString()}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    >
                      <SelectPrimitive.ItemText>
                        {purpose?.name ?? `Purpose ${purposeId}`}
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  );
                })}
                <SelectPrimitive.Separator className="my-1 h-px bg-muted" />
                <SelectPrimitive.Item
                  value={OTHER_SENTINEL}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent italic text-muted-foreground"
                >
                  <SelectPrimitive.ItemText>
                    Other (add new)
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>

      {entry.isOther ? (
        <div className="rounded-md border border-dashed border-amber-300 bg-amber-50/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            New Purpose
          </p>
          <div className="space-y-1">
            <FieldLabel>
              Purpose Name <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              type="text"
              placeholder="e.g. Research"
              value={entry.newPurposeName}
              onChange={(e) => onChange({ newPurposeName: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Purpose Description</FieldLabel>
            <input
              type="text"
              placeholder="Optional description"
              value={entry.newPurposeDescription}
              onChange={(e) =>
                onChange({ newPurposeDescription: e.target.value })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide pt-1">
            New Internet Resource
          </p>
          <div className="space-y-1">
            <FieldLabel>
              Resource Name <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              type="text"
              placeholder="e.g. GitHub"
              value={entry.newResourceName}
              onChange={(e) => onChange({ newResourceName: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>
              URL <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              type="url"
              placeholder="https://..."
              value={entry.newResourceUrl}
              onChange={(e) => onChange({ newResourceUrl: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Resource Description</FieldLabel>
            <input
              type="text"
              placeholder="Optional description"
              value={entry.newResourceDescription}
              onChange={(e) =>
                onChange({ newResourceDescription: e.target.value })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <FieldLabel>Internet Resource</FieldLabel>
          <SearchableCombobox
            options={resourcesForPurpose.map((r) => ({
              value: r.id,
              label: r.name,
            }))}
            value={entry.internetResourceId}
            onValueChange={(v) => onChange({ internetResourceId: v })}
            placeholder="Select internet resource"
            disabled={entry.internetPurposeId === null}
          />
        </div>
      )}

      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <FieldLabel>Date Needed</FieldLabel>
        <input
          type="date"
          value={entry.dateNeeded}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChange({ dateNeeded: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `add-resource/GroupEmailEntryCard.tsx`**

```tsx
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { SearchableCombobox } from "@/shared/components/common/SearchableCombobox";
import type { GroupEmailEntry } from "../../hooks/useAddResource";

interface GroupEmailEntryCardProps {
  entry: GroupEmailEntry;
  allGroupEmails: { id: number; email: string; departmentId: string }[];
  usedGroupEmailIds: number[];
  onChange: (patch: Partial<GroupEmailEntry>) => void;
  onRemove: () => void;
}

export function GroupEmailEntryCard({
  entry,
  allGroupEmails,
  usedGroupEmailIds,
  onChange,
  onRemove,
}: GroupEmailEntryCardProps) {
  const options = allGroupEmails
    .filter((g) => !usedGroupEmailIds.includes(g.id))
    .map((g) => ({ value: g.id, label: `${g.email} — ${g.departmentId}` }));

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-1">
        <FieldLabel>Group Email</FieldLabel>
        <SearchableCombobox
          options={options}
          value={entry.groupEmailId}
          onValueChange={(v) => onChange({ groupEmailId: v })}
          placeholder="Search group emails"
        />
      </div>
      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <FieldLabel>Date Needed</FieldLabel>
        <input
          type="date"
          value={entry.dateNeeded}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChange({ dateNeeded: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `add-resource/SharedFolderEntryCard.tsx`**

```tsx
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { SearchableCombobox } from "@/shared/components/common/SearchableCombobox";
import type { SharedFolderEntry } from "../../hooks/useAddResource";

interface SharedFolderEntryCardProps {
  entry: SharedFolderEntry;
  allSharedFolders: {
    id: number;
    name: string;
    departmentId: string;
    remarks: string;
  }[];
  usedSharedFolderIds: number[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}

export function SharedFolderEntryCard({
  entry,
  allSharedFolders,
  usedSharedFolderIds,
  onChange,
  onRemove,
}: SharedFolderEntryCardProps) {
  const options = allSharedFolders
    .filter((f) => !usedSharedFolderIds.includes(f.id))
    .map((f) => ({
      value: f.id,
      label: `${f.name} — ${f.departmentId} — ${f.remarks}`,
    }));

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="space-y-1">
        <FieldLabel>Shared Folder</FieldLabel>
        <SearchableCombobox
          options={options}
          value={entry.sharedFolderId}
          onValueChange={(v) => onChange({ sharedFolderId: v })}
          placeholder="Search shared folders"
        />
      </div>
      <div className="space-y-1">
        <FieldLabel>Purpose of Access</FieldLabel>
        <Textarea
          placeholder="Describe the purpose of access"
          value={entry.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <FieldLabel>Date Needed</FieldLabel>
        <input
          type="date"
          value={entry.dateNeeded}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChange({ dateNeeded: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write `add-resource/AddResourceDialog.tsx`**

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  NAF,
  InternetRequestInfo,
  GroupEmailInfo,
  SharedFolderInfo,
} from "@/shared/types/api/naf";
import { Progress } from "@/shared/types/enum/progress";
import { useResource, useResourceMetadata } from "@/shared/hooks/useResource";
import {
  useAddResource,
  type InternetEntry,
  type GroupEmailEntry,
  type SharedFolderEntry,
  type BasicResourceWithDate,
} from "../../hooks/useAddResource";
import { BasicResourceSection } from "./BasicResourceSection";
import { InternetEntryCard } from "./InternetEntryCard";
import { GroupEmailEntryCard } from "./GroupEmailEntryCard";
import { SharedFolderEntryCard } from "./SharedFolderEntryCard";

interface AddResourceDialogProps {
  naf: NAF;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddResourceDialog({
  naf,
  open,
  onOpenChange,
}: AddResourceDialogProps) {
  const [basicResources, setBasicResources] = useState<BasicResourceWithDate[]>(
    [],
  );
  const [internetEntries, setInternetEntries] = useState<InternetEntry[]>([]);
  const [groupEmailEntries, setGroupEmailEntries] = useState<GroupEmailEntry[]>(
    [],
  );
  const [sharedFolderEntries, setSharedFolderEntries] = useState<
    SharedFolderEntry[]
  >([]);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getAllResource } = useResource();
  const { internetPurposes, internetResources, groupEmails, sharedFolders } =
    useResourceMetadata();
  const { submit } = useAddResource();

  const existingResourceIds = naf.resourceRequests.map((rr) => rr.resource.id);

  const usedInternetResourceIds = naf.resourceRequests
    .filter(
      (rr) =>
        rr.additionalInfo?.type === 0 && rr.progress === Progress.ACCOMPLISHED,
    )
    .map((rr) => (rr.additionalInfo as InternetRequestInfo).internetResourceId);

  const usedGroupEmailIds = naf.resourceRequests
    .filter(
      (rr) =>
        rr.additionalInfo?.type === 2 && rr.progress === Progress.ACCOMPLISHED,
    )
    .map((rr) => (rr.additionalInfo as GroupEmailInfo).groupEmailId);

  const usedSharedFolderIds = naf.resourceRequests
    .filter(
      (rr) =>
        rr.additionalInfo?.type === 1 && rr.progress === Progress.ACCOMPLISHED,
    )
    .map((rr) => (rr.additionalInfo as SharedFolderInfo).sharedFolderId);

  const availableBasic = (getAllResource.data ?? []).filter(
    (r) => !r.isSpecial && !existingResourceIds.includes(r.id),
  );

  const newEntry = () => crypto.randomUUID();

  const addInternetEntry = () =>
    setInternetEntries((prev) => [
      ...prev,
      {
        _id: newEntry(),
        internetPurposeId: null,
        internetResourceId: null,
        purpose: "",
        dateNeeded: "",
        isOther: false,
        newPurposeName: "",
        newPurposeDescription: "",
        newResourceName: "",
        newResourceUrl: "",
        newResourceDescription: "",
      },
    ]);

  const addGroupEmailEntry = () =>
    setGroupEmailEntries((prev) => [
      ...prev,
      { _id: newEntry(), groupEmailId: null, purpose: "", dateNeeded: "" },
    ]);

  const addSharedFolderEntry = () =>
    setSharedFolderEntries((prev) => [
      ...prev,
      { _id: newEntry(), sharedFolderId: null, purpose: "", dateNeeded: "" },
    ]);

  const patchInternetEntry = (_id: string, patch: Partial<InternetEntry>) =>
    setInternetEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const patchGroupEmailEntry = (_id: string, patch: Partial<GroupEmailEntry>) =>
    setGroupEmailEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const patchSharedFolderEntry = (
    _id: string,
    patch: Partial<SharedFolderEntry>,
  ) =>
    setSharedFolderEntries((prev) =>
      prev.map((e) => (e._id === _id ? { ...e, ...patch } : e)),
    );

  const isInternetEntryComplete = (e: InternetEntry) =>
    e.isOther
      ? e.newPurposeName.trim().length > 0 &&
        e.newResourceName.trim().length > 0 &&
        e.newResourceUrl.trim().length > 0 &&
        e.purpose.trim().length > 0
      : e.internetResourceId !== null && e.purpose.trim().length > 0;

  const isGroupEmailEntryComplete = (e: GroupEmailEntry) =>
    e.groupEmailId !== null && e.purpose.trim().length > 0;
  const isSharedFolderEntryComplete = (e: SharedFolderEntry) =>
    e.sharedFolderId !== null && e.purpose.trim().length > 0;

  const hasAnything =
    basicResources.length > 0 ||
    internetEntries.length > 0 ||
    groupEmailEntries.length > 0 ||
    sharedFolderEntries.length > 0;
  const allComplete =
    internetEntries.every(isInternetEntryComplete) &&
    groupEmailEntries.every(isGroupEmailEntryComplete) &&
    sharedFolderEntries.every(isSharedFolderEntryComplete);
  const canSubmit = hasAnything && allComplete && !isSubmitting;

  const reset = () => {
    setBasicResources([]);
    setInternetEntries([]);
    setGroupEmailEntries([]);
    setSharedFolderEntries([]);
    setSubmitErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitErrors([]);
    const result = await submit({
      nafId: naf.id,
      basicResources,
      internetEntries,
      groupEmailEntries,
      sharedFolderEntries,
    });
    setIsSubmitting(false);
    if (result.allSucceeded) {
      reset();
      onOpenChange(false);
    } else {
      setSubmitErrors(result.errors);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="w-full max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-amber-600 font-bold">
            Add Resources
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{naf.reference}</p>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1"
        >
          <BasicResourceSection
            availableBasic={availableBasic}
            basicResources={basicResources}
            onChange={setBasicResources}
          />

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                INTERNET ACCESS
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInternetEntry}
              >
                + Add Entry
              </Button>
            </div>
            {internetEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {internetEntries.map((entry) => (
              <InternetEntryCard
                key={entry._id}
                entry={entry}
                allInternetResources={internetResources.data ?? []}
                allInternetPurposes={internetPurposes.data ?? []}
                usedInternetResourceIds={[
                  ...usedInternetResourceIds,
                  ...internetEntries
                    .filter(
                      (e) =>
                        e._id !== entry._id && e.internetResourceId !== null,
                    )
                    .map((e) => e.internetResourceId!),
                ]}
                onChange={(patch) => patchInternetEntry(entry._id, patch)}
                onRemove={() =>
                  setInternetEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                GROUP EMAIL
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGroupEmailEntry}
              >
                + Add Entry
              </Button>
            </div>
            {groupEmailEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {groupEmailEntries.map((entry) => (
              <GroupEmailEntryCard
                key={entry._id}
                entry={entry}
                allGroupEmails={groupEmails.data ?? []}
                usedGroupEmailIds={[
                  ...usedGroupEmailIds,
                  ...groupEmailEntries
                    .filter(
                      (e) => e._id !== entry._id && e.groupEmailId !== null,
                    )
                    .map((e) => e.groupEmailId!),
                ]}
                onChange={(patch) => patchGroupEmailEntry(entry._id, patch)}
                onRemove={() =>
                  setGroupEmailEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-500">
                SHARED FOLDER
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSharedFolderEntry}
              >
                + Add Entry
              </Button>
            </div>
            {sharedFolderEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No entries yet
              </p>
            )}
            {sharedFolderEntries.map((entry) => (
              <SharedFolderEntryCard
                key={entry._id}
                entry={entry}
                allSharedFolders={sharedFolders.data ?? []}
                usedSharedFolderIds={[
                  ...usedSharedFolderIds,
                  ...sharedFolderEntries
                    .filter(
                      (e) => e._id !== entry._id && e.sharedFolderId !== null,
                    )
                    .map((e) => e.sharedFolderId!),
                ]}
                onChange={(patch) => patchSharedFolderEntry(entry._id, patch)}
                onRemove={() =>
                  setSharedFolderEntries((prev) =>
                    prev.filter((e) => e._id !== entry._id),
                  )
                }
              />
            ))}
          </section>

          {submitErrors.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1">
              {submitErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">
                  • {err}
                </p>
              ))}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSubmitting ? "Adding..." : "Add Resources"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: Write `add-resource/index.ts`**

```ts
export { AddResourceDialog } from "./AddResourceDialog";
```

- [ ] **Step 7: Update import in `ViewNAFDetail.tsx`**

Replace:

```ts
import { AddResourceDialog } from "@/features/naf/components/addResourceDialog";
```

With:

```ts
import { AddResourceDialog } from "@/features/naf/components/add-resource";
```

- [ ] **Step 8: Delete the original file**

```bash
cd NAFClient && rm src/features/naf/components/addResourceDialog.tsx
```

- [ ] **Step 9: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: decompose addResourceDialog into add-resource/ subfolder"
```

---

### Task 5: Split `ViewNAFDetail.tsx`

Extract `EmployeeDetailsCard` (+ header section) into `NAFDetailHeader.tsx` and `RequestsSection` + `RequestItemWrapper` into `ResourceRequestList.tsx`.

**Files:**

- Create: `src/features/naf/components/NAFDetailHeader.tsx`
- Create: `src/features/naf/components/ResourceRequestList.tsx`
- Modify: `src/features/naf/pages/ViewNAFDetail.tsx`

- [ ] **Step 1: Write `src/features/naf/components/NAFDetailHeader.tsx`**

```tsx
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NAF } from "@/shared/types/api/naf";

function DetailField({
  label,
  value,
  placeholder = "—",
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {value ? (
        <p className="text-sm font-medium">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">{placeholder}</p>
      )}
    </div>
  );
}

interface NAFDetailHeaderProps {
  naf: NAF;
  onDeactivate: () => void;
}

export function NAFDetailHeader({ naf, onDeactivate }: NAFDetailHeaderProps) {
  const employee = naf?.employee;

  if (!employee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Employee details unavailable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fullName = [employee.lastName, employee.firstName, employee.middleName]
    .filter(Boolean)
    .join(", ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 gap-4 flex-wrap">
        <CardTitle className="text-lg font-bold">Employee Details</CardTitle>
        <Button
          size="sm"
          className="bg-red-400 hover:bg-red-500 text-white gap-1.5 shrink-0"
          onClick={onDeactivate}
        >
          Deactivate Access <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
          <div className="space-y-4">
            <DetailField label="Employee Name" value={fullName} />
            <DetailField label="Company" value={employee.company} />
            <DetailField label="Location" value={employee.location} />
          </div>
          <div className="space-y-4">
            <DetailField
              label="Department"
              value={employee.departmentDesc ?? employee.departmentId}
            />
            <DetailField label="Position" value={employee.position} />
            <DetailField
              label="Domain"
              value={null}
              placeholder="No Domain Yet"
            />
            <DetailField
              label="Username"
              value={null}
              placeholder="No Username Yet"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Write `src/features/naf/components/ResourceRequestList.tsx`**

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type {
  NAF,
  ResourceGroup,
  ResourceRequest,
  PurposeProps,
} from "@/shared/types/api/naf";
import { ProgressStatus } from "@/shared/types/api/naf";
import { getResourceGroups } from "@/shared/api/resourceService";
import { useResourceRequest } from "../hooks/useResourceRequest";
import { ResourceRequestAccordionItem } from "./resource-request";
import { AddResourceDialog } from "./add-resource";

interface RequestItemWrapperProps {
  naf: NAF;
  request: ResourceRequest;
  currentUserId: string;
  resourceGroups: ResourceGroup[];
  onRemind: (id: string) => void;
  onDeactivate: (id: string) => void;
}

function RequestItemWrapper({
  naf,
  request,
  currentUserId,
  resourceGroups,
  onRemind,
  onDeactivate,
}: RequestItemWrapperProps) {
  const {
    updateResourceRequestAsync,
    deleteResourceRequestAsync,
    approveRequestAsync,
    rejectRequestAsync,
    cancelRequestAsync,
    changeResourceAsync,
  } = useResourceRequest(request.id, request.nafId);

  const handleEdit = async (
    _requestId: string,
    _nafId: string,
    purpose: PurposeProps,
  ) => {
    try {
      await updateResourceRequestAsync(purpose);
    } catch (error) {
      console.error("Failed to update resource request:", error);
    }
  };

  const handleResubmit = async (
    _requestId: string,
    _nafId: string,
    purpose: PurposeProps,
  ) => {
    try {
      await updateResourceRequestAsync({ purpose: purpose.purpose });
    } catch (error) {
      console.error("Failed to resubmit resource request:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResourceRequestAsync(id);
    } catch (error) {
      console.error("Failed to delete resource request:", error);
    }
  };

  const activeStep = request.steps.find(
    (s) => s.stepOrder === request.currentStep,
  );
  const isCurrentApprover = activeStep?.approverId === currentUserId;
  const isApproverForThisRequest = request.steps.some(
    (s) => s.approverId === currentUserId,
  );
  const isRequestor = naf.requestorId === currentUserId;

  const handleApprove = async (_id: string, comment: string) => {
    if (!isApproverForThisRequest || !activeStep) return;
    try {
      await approveRequestAsync({ stepId: activeStep.id, comment });
    } catch (error) {
      console.error("Failed to approve resource request:", error);
    }
  };

  const handleReject = async (_id: string, reason: string) => {
    if (!isApproverForThisRequest || !activeStep) return;
    try {
      await rejectRequestAsync({
        stepId: activeStep.id,
        reasonForRejection: reason,
      });
    } catch (error) {
      console.error("Failed to reject resource request:", error);
    }
  };

  const handleCancel = async (_id: string) => {
    try {
      await cancelRequestAsync();
    } catch (error) {
      console.error("Failed to cancel resource request:", error);
    }
  };

  const resourceGroup = resourceGroups.find((g) =>
    g.resources.some((r) => r.id === request.resource.id),
  );
  const existingResourceIds = new Set(
    naf.resourceRequests.map((rr) => rr.resource.id),
  );
  const groupResources =
    resourceGroup?.resources.filter(
      (r) =>
        r.isActive &&
        r.id !== request.resource.id &&
        !existingResourceIds.has(r.id),
    ) ?? [];

  const handleChangeResource = async (
    _requestId: string,
    newResourceId: number,
  ) => {
    try {
      await changeResourceAsync(newResourceId);
    } catch (error) {
      console.error("Failed to change resource:", error);
    }
  };

  return (
    <ResourceRequestAccordionItem
      isRequestor={isRequestor}
      request={request}
      isApprover={isApproverForThisRequest}
      isCurrentApprover={isCurrentApprover}
      resourceGroup={resourceGroup}
      groupResources={groupResources}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRemind={onRemind}
      onDeactivate={onDeactivate}
      onResubmit={handleResubmit}
      onCancel={handleCancel}
      onChangeResource={handleChangeResource}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}

interface ResourceRequestListProps {
  naf: NAF;
  currentUserId: string;
}

export function ResourceRequestList({
  naf,
  currentUserId,
}: ResourceRequestListProps) {
  const [addResourceOpen, setAddResourceOpen] = useState(false);

  const resourceGroupsQuery = useQuery({
    queryKey: ["resourceGroups"],
    queryFn: getResourceGroups,
    staleTime: 1000 * 60 * 10,
  });
  const resourceGroups = resourceGroupsQuery.data ?? [];

  const pendingCount = (naf?.resourceRequests ?? []).filter((r) => {
    const p = r.progress as unknown as ProgressStatus;
    return (
      p !== ProgressStatus.Accomplished &&
      p !== ProgressStatus["Not Accomplished"]
    );
  }).length;

  const handleRemind = (id: string) => console.log("TODO remind", id);
  const handleDeactivate = (id: string) =>
    console.log("TODO deactivate resource request", id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold">Requests</h2>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="text-sm font-semibold text-amber-500">
              {pendingCount} pending
            </span>
          )}
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            onClick={() => setAddResourceOpen(true)}
          >
            + Add Resources
          </Button>
        </div>
      </div>
      <AddResourceDialog
        naf={naf}
        open={addResourceOpen}
        onOpenChange={setAddResourceOpen}
      />
      <Accordion type="multiple" className="space-y-2">
        {(naf?.resourceRequests ?? []).map((req) => (
          <RequestItemWrapper
            naf={naf}
            key={req.id}
            request={req}
            currentUserId={currentUserId}
            resourceGroups={resourceGroups}
            onRemind={handleRemind}
            onDeactivate={handleDeactivate}
          />
        ))}
      </Accordion>
    </div>
  );
}
```

- [ ] **Step 3: Write the reduced `src/features/naf/pages/ViewNAFDetail.tsx`**

```tsx
import { useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { ProgressStatus } from "@/shared/types/api/naf";
import RequestorLayout from "@/shared/components/layout/RequestorLayout";
import { useNAF } from "../hooks/useNAF";
import { useAuth } from "@/features/auth/AuthContext";
import { NAFDetailHeader } from "../components/NAFDetailHeader";
import { ResourceRequestList } from "../components/ResourceRequestList";

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function nafProgressLabel(progress: number): string {
  return ProgressStatus[progress as ProgressStatus] ?? String(progress);
}

function nafProgressColor(progress: number): string {
  switch (progress as ProgressStatus) {
    case ProgressStatus["In Progress"]:
      return "text-blue-600";
    case ProgressStatus.Accomplished:
      return "text-emerald-600";
    case ProgressStatus.Rejected:
      return "text-red-500";
    case ProgressStatus["For Screening"]:
      return "text-teal-600";
    default:
      return "text-amber-500";
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-5 w-64 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
        <div className="h-5 w-24 bg-muted rounded" />
      </div>
      <div className="h-px bg-muted" />
      <div className="h-48 bg-muted rounded-lg" />
      <div className="h-6 w-32 bg-muted rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-muted rounded-lg" />
      ))}
    </div>
  );
}

export default function NAFDetailPage() {
  const { nafId } = useParams<{ nafId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.employeeId ?? "";

  const {
    nafQuery: naf,
    isLoading,
    isError,
    deactivateNAFAsync,
  } = useNAF({ nafId });

  const handleDeactivateNAF = async () => {
    if (!nafId) return;
    try {
      await deactivateNAFAsync(nafId);
    } catch (error) {
      console.error("Failed to deactivate NAF:", error);
    }
  };

  return (
    <RequestorLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 px-4 sm:px-6">
        {isLoading && <LoadingSkeleton />}
        {isError && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Failed to load NAF details. Please try again.
          </div>
        )}
        {!isLoading && !isError && !naf?.data && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            NAF not found.
          </div>
        )}

        {naf?.data && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-semibold text-foreground">
                    Reference:
                  </span>
                  <span className="text-base font-bold text-amber-500">
                    {naf.data.reference}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last Update: {formatDateTime(naf.data.updatedAt)}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                <span className="text-xs text-muted-foreground">Status</span>
                <span
                  className={`text-sm font-bold ${nafProgressColor(naf.data.progress as unknown as number)}`}
                >
                  {nafProgressLabel(naf.data.progress as unknown as number)}
                </span>
              </div>
            </div>
            <Separator />
            <NAFDetailHeader
              naf={naf.data}
              onDeactivate={handleDeactivateNAF}
            />
            <ResourceRequestList naf={naf.data} currentUserId={currentUserId} />
          </>
        )}
      </div>
    </RequestorLayout>
  );
}
```

- [ ] **Step 4: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: split ViewNAFDetail into NAFDetailHeader + ResourceRequestList"
```

---

### Task 6: Create `features/naf/index.ts`

**Files:**

- Create: `NAFClient/src/features/naf/index.ts`

- [ ] **Step 1: Write `src/features/naf/index.ts`**

```ts
export { default as ViewAllNAF } from "./pages/ViewAllNAF";
export { default as NAFDetailPage } from "./pages/ViewNAFDetail";
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: add features/naf/index.ts barrel export"
```
