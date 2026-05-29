# Server Error Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the server's actual error message in every mutation's error toast instead of hardcoded generic strings.

**Architecture:** An Axios response interceptor normalizes all HTTP errors into a typed `ApiError` before they reach React Query. A `MutationCache` global `onError` handler on the QueryClient fires `toast.error(error.message)` centrally for every rejected mutation. Per-mutation `onError` toast callbacks are then dead code and removed.

**Tech Stack:** TypeScript, Axios, @tanstack/react-query v5, Sonner

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/shared/lib/apiError.ts` | Typed error class extracted from server responses |
| Modify | `src/shared/api/client.ts` | Add Axios response interceptor |
| Modify | `src/app/queryClient.ts` | Add `MutationCache` with global `onError` |
| Modify | `src/features/naf/hooks/useResourceRequest.ts` | Remove 8 `onError` toast callbacks |
| Modify | `src/features/naf/hooks/useNAF.ts` | Remove 2 `onError` toast callbacks |
| Modify | `src/features/admin/hooks/useAdminUsers.ts` | Remove 3 `onError` toast callbacks |
| Modify | `src/features/admin/hooks/useMyTasks.ts` | Remove 2 `onError` toast callbacks |

**Do NOT touch:**
- `useNotifications.ts` — `onError` callbacks roll back optimistic updates, not toasts
- `useAddResource.ts` — custom partial-success logic, never rejects the mutation
- `AuthContext.tsx` — intentionally silences errors

---

## Task 1: Create `ApiError` class

**Files:**
- Create: `NAFClient/src/shared/lib/apiError.ts`

- [ ] **Step 1: Create the file**

```ts
// NAFClient/src/shared/lib/apiError.ts
import type { AxiosError } from "axios";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  static fromAxios(error: AxiosError): ApiError {
    const data = error.response?.data as Record<string, string> | undefined;
    const message =
      data?.error ??
      data?.message ??
      error.response?.statusText ??
      "Something went wrong.";
    const status = error.response?.status ?? 0;
    return new ApiError(message, status);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd NAFClient; npm run build
```

Expected: `✓ built in X.XXs` — no errors.

- [ ] **Step 3: Commit**

```powershell
git add NAFClient/src/shared/lib/apiError.ts
git commit -m "feat: add ApiError class for typed server error extraction"
```

---

## Task 2: Add Axios response interceptor

**Files:**
- Modify: `NAFClient/src/shared/api/client.ts`

- [ ] **Step 1: Replace the file contents**

```ts
// NAFClient/src/shared/api/client.ts
import axios, { type AxiosError } from "axios";
import { ApiError } from "@/shared/lib/apiError";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(ApiError.fromAxios(error)),
);
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd NAFClient; npm run build
```

Expected: `✓ built in X.XXs` — no errors.

- [ ] **Step 3: Commit**

```powershell
git add NAFClient/src/shared/api/client.ts
git commit -m "feat: add axios interceptor to normalize errors into ApiError"
```

---

## Task 3: Add `MutationCache` global `onError` to QueryClient

**Files:**
- Modify: `NAFClient/src/app/queryClient.ts`

- [ ] **Step 1: Replace the file contents**

```ts
// NAFClient/src/app/queryClient.ts
import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/apiError";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong.";
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 2,
    },
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd NAFClient; npm run build
```

Expected: `✓ built in X.XXs` — no errors.

- [ ] **Step 3: Commit**

```powershell
git add NAFClient/src/app/queryClient.ts
git commit -m "feat: add MutationCache global onError to display server error messages"
```

---

## Task 4: Remove per-mutation `onError` toast callbacks

The global handler now covers all mutations. Remove `onError: () => toast.error(...)` from every hook. The `toast` import is removed from files where it's no longer used.

**Files:**
- Modify: `NAFClient/src/features/naf/hooks/useResourceRequest.ts`
- Modify: `NAFClient/src/features/naf/hooks/useNAF.ts`
- Modify: `NAFClient/src/features/admin/hooks/useAdminUsers.ts`
- Modify: `NAFClient/src/features/admin/hooks/useMyTasks.ts`

- [ ] **Step 1: Replace `useResourceRequest.ts`**

```ts
// NAFClient/src/features/naf/hooks/useResourceRequest.ts
import {
  approveResourceRequest,
  cancelResourceRequest,
  changeResource,
  createResourceRequest,
  deactivateResourceRequest,
  deleteResourceRequest,
  editResourceRequestPurpose,
  rejectResourceRequest,
} from "../api";
import type { NAF, PurposeProps } from "@/shared/types/api/naf";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useResourceRequest = (
  resourceRequestId: string,
  NAFId?: string,
) => {
  const queryClient = useQueryClient();

  const updateResourceRequest = useMutation({
    mutationFn: (purpose: PurposeProps) =>
      editResourceRequestPurpose(resourceRequestId, purpose),
    onSuccess: (updatedRequest) => {
      queryClient.setQueryData<NAF | undefined>(["naf", NAFId], (oldNAF) => {
        if (!oldNAF) return oldNAF;
        return {
          ...oldNAF,
          resourceRequests: oldNAF.resourceRequests.map((req) =>
            req.id === updatedRequest.id ? updatedRequest : req,
          ),
        };
      });
      toast.success("Purpose updated");
    },
  });

  const removeResourceRequest = useMutation({
    mutationFn: deleteResourceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
      toast.success("Resource removed");
    },
  });

  const changeResourceRequest = useMutation({
    mutationFn: (payload: { resourceId: number; purpose?: string; dateNeeded?: string | null }) =>
      changeResource(resourceRequestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      toast.success("Resource request changed!");
    },
  });

  const approveRequest = useMutation({
    mutationFn: ({ stepId, comment }: { stepId: string; comment?: string }) =>
      approveResourceRequest(stepId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
      toast.success("Request approved");
    },
  });

  const rejectRequest = useMutation({
    mutationFn: ({
      stepId,
      reasonForRejection,
    }: {
      stepId: string;
      reasonForRejection: string;
    }) => rejectResourceRequest(stepId, reasonForRejection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["approverNAFs"] });
      toast.success("Request rejected");
    },
  });

  const cancelRequest = useMutation({
    mutationFn: () => cancelResourceRequest(resourceRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      toast.success("Request cancelled");
    },
  });

  const deactivateRequest = useMutation({
    mutationFn: () => deactivateResourceRequest(resourceRequestId),
    onSuccess: (updatedRequest) => {
      queryClient.setQueryData<NAF | undefined>(["naf", NAFId], (oldNAF) => {
        if (!oldNAF) return oldNAF;
        return {
          ...oldNAF,
          resourceRequests: oldNAF.resourceRequests.map((req) =>
            req.id === updatedRequest.id ? updatedRequest : req,
          ),
        };
      });
      toast.success("Resource deactivated");
    },
  });

  const createRequest = useMutation({
    mutationFn: (payload: {
      nafId: string;
      resourceId: number;
      purpose: string;
      dateNeeded?: string | null;
    }) => createResourceRequest({ ...payload, additionalInfo: {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["naf", NAFId] });
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      toast.success("New resource request created");
    },
  });

  return {
    updateResourceRequestAsync: updateResourceRequest.mutateAsync,
    updateError: updateResourceRequest.isError,
    deleteResourceRequestAsync: removeResourceRequest.mutateAsync,
    deleteError: removeResourceRequest.isError,
    approveRequestAsync: approveRequest.mutateAsync,
    approveRequestError: approveRequest.isError,
    rejectRequestAsync: rejectRequest.mutateAsync,
    rejectRequestError: rejectRequest.isError,
    cancelRequestAsync: cancelRequest.mutateAsync,
    cancelRequestError: cancelRequest.isError,
    createRequestAsync: createRequest.mutateAsync,
    createRequestError: createRequest.isError,
    changeResourceAsync: changeResourceRequest.mutateAsync,
    changeResourceError: changeResourceRequest.isError,
    deactivateRequestAsync: deactivateRequest.mutateAsync,
    deactivateRequestError: deactivateRequest.isError,
  };
};
```

- [ ] **Step 2: Replace `useNAF.ts`**

```ts
// NAFClient/src/features/naf/hooks/useNAF.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { STALE_TIME } from "@/shared/constants/queryConstants";
import {
  getSubordinateNAFs,
  getApproverNAFs,
  getNAF,
  getEmployeeNAFs,
  createNAF,
  deactivateNAF,
} from "../api";
import { toast } from "sonner";
import type { NAF } from "@/shared/types/api/naf";
import type { PagedResult } from "@/shared/types/common/pagedResult";

type PaginationObject = {
  subordinatePage: number;
  approvalPage: number;
};

export const useEmployeeNAF = (
  { subordinatePage, approvalPage }: PaginationObject,
  employeeId?: string,
) => {
  const subordinateNAFsQuery = useQuery<PagedResult<NAF>, Error>({
    queryKey: ["subordinateNAFs", employeeId, subordinatePage],
    queryFn: () => getSubordinateNAFs(employeeId!, subordinatePage ?? 1),
    enabled: !!employeeId,
    staleTime: STALE_TIME.MEDIUM,
  });

  const approverNAFsQuery = useQuery<PagedResult<NAF>, Error>({
    queryKey: ["approverNAFs", employeeId, approvalPage],
    queryFn: () => getApproverNAFs(employeeId!, approvalPage),
    enabled: !!employeeId,
    staleTime: STALE_TIME.MEDIUM,
  });

  return {
    subordinateNAFsQuery,
    approverNAFsQuery,
    isLoading: subordinateNAFsQuery.isLoading || approverNAFsQuery.isLoading,
    isError: subordinateNAFsQuery.isError || approverNAFsQuery.isError,
  };
};

type UseNAFParams = {
  employeeId?: string;
  nafId?: string;
};

export const useNAF = ({ employeeId, nafId }: UseNAFParams) => {
  const queryClient = useQueryClient();

  const nafQuery = useQuery<NAF, Error>({
    queryKey: ["naf", nafId],
    queryFn: () => getNAF(nafId!),
    enabled: !!nafId,
    initialData: () => {
      const queries = queryClient.getQueriesData<PagedResult<NAF>>({
        queryKey: ["nafs"],
      });
      for (const [, data] of queries) {
        const found = data?.data.find((n) => n.id === nafId);
        if (found) return found;
      }
      return undefined;
    },
  });

  const employeeNAFs = useQuery<NAF[], Error>({
    queryKey: ["employeeNAF", employeeId],
    queryFn: () => getEmployeeNAFs(employeeId!),
    enabled: !!employeeId,
    staleTime: STALE_TIME.MEDIUM,
  });

  const createNAFMutation = useMutation({
    mutationFn: (payload: {
      employeeId: string;
      requestorId: string;
      hardwareId: number;
      dateNeeded?: string | null;
    }) => createNAF(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["employeeNAF"] });
      queryClient.invalidateQueries({ queryKey: ["hr", "nafs"] });
      toast.success("NAF created successfully");
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => deactivateNAF(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subordinateNAFs"] });
      queryClient.invalidateQueries({ queryKey: ["employeeNAF"] });
      toast.success("NAF deactivated");
    },
  });

  return {
    nafQuery,
    employeeNAFs,
    createNAF: createNAFMutation.mutate,
    createNAFAsync: createNAFMutation.mutateAsync,
    createError: createNAFMutation.isError,
    deactivateNAFAsync: deactivate.mutateAsync,
    deactivateNAFError: deactivate.isError,
    isLoading: nafQuery.isLoading || employeeNAFs.isLoading,
    isError: nafQuery.isError || employeeNAFs.isLoading,
  };
};
```

- [ ] **Step 3: Replace `useAdminUsers.ts`**

```ts
// NAFClient/src/features/admin/hooks/useAdminUsers.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useAdminUsers() {
  const queryClient = useQueryClient();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const createUserMutation = useMutation({
    mutationFn: ({ employeeId, role, locationId }: { employeeId: string; role: string; locationId: number }) =>
      adminApi.createUser(employeeId, { role, locationId }),
    onSuccess: () => { invalidateUsers(); toast.success("User added"); },
  });

  const addRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      adminApi.addRole(userId, role),
    onSuccess: () => { invalidateUsers(); toast.success("Role assigned"); },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: number; roleName: string }) => {
      const roles = await adminApi.getUserActiveRoles(userId);
      const target = roles.find((r) => r.role === roleName);
      if (!target) throw new Error(`Role ${roleName} not found on user`);
      return adminApi.removeRole(userId, target.roleId);
    },
    onSuccess: () => { invalidateUsers(); toast.success("Role removed"); },
  });

  return { createUserMutation, addRoleMutation, removeRoleMutation };
}
```

- [ ] **Step 4: Replace `useMyTasks.ts`**

```ts
// NAFClient/src/features/admin/hooks/useMyTasks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import { toast } from "sonner";

export function useMyTasks() {
  const queryClient = useQueryClient();

  const myTasksQuery = useQuery({
    queryKey: ["tech", "my-tasks"],
    queryFn: adminApi.getMyTasks,
  });

  const setToDelayedMutation = useMutation({
    mutationFn: ({ implementationId, reason }: { implementationId: string; reason: string }) =>
      adminApi.setToDelayed(implementationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      toast.success("Marked as delayed");
    },
  });

  const setToAccomplishedMutation = useMutation({
    mutationFn: (implementationId: string) =>
      adminApi.setToAccomplished(implementationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tech", "my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tech", "for-implementations"] });
      toast.success("Marked as accomplished");
    },
  });

  return { myTasksQuery, setToDelayedMutation, setToAccomplishedMutation };
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```powershell
cd NAFClient; npm run build
```

Expected: `✓ built in X.XXs` — no errors.

- [ ] **Step 6: Commit**

```powershell
git add NAFClient/src/features/naf/hooks/useResourceRequest.ts
git add NAFClient/src/features/naf/hooks/useNAF.ts
git add NAFClient/src/features/admin/hooks/useAdminUsers.ts
git add NAFClient/src/features/admin/hooks/useMyTasks.ts
git commit -m "refactor: remove per-mutation onError toasts, handled by MutationCache globally"
```
