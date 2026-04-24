# Shared Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `src/shared/` and migrate all cross-feature utilities, types, components, and API services so that feature-level code can import from clean, stable paths.

**Architecture:** Move files in logical groups — components first (covered by Vite alias, zero import changes), then utils, types, hooks, API services, and the resource hook last. Each task ends with a build verification. The Vite `@/components` alias is added in Task 1 so all existing `@/components/ui/` imports keep working automatically after the move.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, ShadCN

---

## File Map

| Source | Destination | Note |
|--------|-------------|------|
| `NAFClient/vite.config.ts` | same | add alias |
| `src/components/` (entire folder) | `src/shared/components/` | alias handles all imports |
| `src/global/component/select.tsx` | `src/shared/components/common/select.tsx` | update `@/global/component/` imports |
| `src/lib/utils.ts` | `src/shared/utils/utils.ts` | update `@/lib/utils` imports |
| `src/lib/dateUrgency.ts` | `src/shared/utils/dateUrgency.ts` | update `@/lib/dateUrgency` imports |
| `src/types/` (entire folder) | `src/shared/types/` | update `@/types/` imports |
| `src/hooks/use-mobile.ts` | `src/shared/hooks/use-mobile.ts` | update `@/hooks/use-mobile` imports |
| `src/services/api.tsx` | `src/shared/api/client.ts` | rename export path; update all EntityAPI service imports |
| `src/services/EntityAPI/employeeService.ts` | `src/shared/api/employeeService.ts` | |
| `src/services/EntityAPI/resourceService.ts` | `src/shared/api/resourceService.ts` | |
| `src/services/EntityAPI/resourceMetadataService.ts` | `src/shared/api/resourceMetadataService.ts` | |
| `src/features/resources/hooks/useResource.tsx` | `src/shared/hooks/useResource.ts` | update `@/features/resources/hooks/useResource` imports |

---

### Task 1: Vite alias + move components

**Files:**
- Modify: `NAFClient/vite.config.ts`
- Move (git mv): `NAFClient/src/components/` → `NAFClient/src/shared/components/`
- Create: `NAFClient/src/shared/components/common/select.tsx`
- Delete: `NAFClient/src/global/`

- [ ] **Step 1: Update vite.config.ts — add `@/components` alias before `@`**

```ts
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@/components": path.resolve(__dirname, "./src/shared/components"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 2: Create the shared directory tree and git-move components**

```bash
cd NAFClient
mkdir -p src/shared/components src/shared/utils src/shared/types src/shared/hooks src/shared/api
git mv src/components/ui src/shared/components/ui
git mv src/components/layout src/shared/components/layout
git mv src/components/common src/shared/components/common
```

- [ ] **Step 3: Move global/component/select.tsx into shared/components/common/**

Read `NAFClient/src/global/component/select.tsx` then write it to `NAFClient/src/shared/components/common/select.tsx` with identical content.

- [ ] **Step 4: Find all files importing from `@/global/component/` and update them**

```bash
grep -rl "@/global/component/" src --include="*.ts" --include="*.tsx"
```

For each file found, replace `@/global/component/` with `@/shared/components/common/`.

- [ ] **Step 5: Delete the now-empty global/ folder**

```bash
rm -rf src/global
```

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with 0 errors. All `@/components/ui/` imports resolve via the new alias.

- [ ] **Step 7: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: move components to shared/, add @/components alias"
```

---

### Task 2: Move utils

**Files:**
- Create: `NAFClient/src/shared/utils/utils.ts`
- Create: `NAFClient/src/shared/utils/dateUrgency.ts`
- Delete: `NAFClient/src/lib/`

- [ ] **Step 1: Write `src/shared/utils/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: git-move dateUrgency.ts**

```bash
cd NAFClient
git mv src/lib/dateUrgency.ts src/shared/utils/dateUrgency.ts
```

- [ ] **Step 3: Delete old utils.ts and lib/**

```bash
rm src/lib/utils.ts
rmdir src/lib 2>/dev/null || true
```

- [ ] **Step 4: Replace all `@/lib/utils` imports**

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i 's|@/lib/utils|@/shared/utils/utils|g'
```

- [ ] **Step 5: Replace all `@/lib/dateUrgency` imports**

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i 's|@/lib/dateUrgency|@/shared/utils/dateUrgency|g'
```

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: move lib/ to shared/utils/"
```

---

### Task 3: Move types

**Files:**
- Move: `NAFClient/src/types/` → `NAFClient/src/shared/types/`

- [ ] **Step 1: git-move types folder**

```bash
cd NAFClient
git mv src/types src/shared/types
```

- [ ] **Step 2: Replace all `@/types/` imports site-wide**

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i 's|@/types/|@/shared/types/|g'
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: move types/ to shared/types/"
```

---

### Task 4: Move hooks

**Files:**
- Create: `NAFClient/src/shared/hooks/use-mobile.ts`
- Delete: `NAFClient/src/hooks/`

- [ ] **Step 1: git-move use-mobile.ts**

```bash
cd NAFClient
git mv src/hooks/use-mobile.ts src/shared/hooks/use-mobile.ts
rmdir src/hooks 2>/dev/null || true
```

- [ ] **Step 2: Replace all `@/hooks/use-mobile` imports**

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i 's|@/hooks/use-mobile|@/shared/hooks/use-mobile|g'
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: move hooks/ to shared/hooks/"
```

---

### Task 5: Move shared API services

This task moves the Axios client and three cross-feature services into `src/shared/api/`. The remaining feature-specific services (`nafService`, `resourceRequestService`, `authService`, `adminService`, `implementationService`) stay in `src/services/EntityAPI/` for now — only their import of the Axios client needs updating.

**Files:**
- Create: `NAFClient/src/shared/api/client.ts`
- Create: `NAFClient/src/shared/api/employeeService.ts`
- Create: `NAFClient/src/shared/api/resourceService.ts`
- Create: `NAFClient/src/shared/api/resourceMetadataService.ts`
- Modify: `NAFClient/src/services/EntityAPI/nafService.ts`
- Modify: `NAFClient/src/services/EntityAPI/resourceRequestService.ts`
- Modify: `NAFClient/src/services/EntityAPI/authService.ts`
- Modify: `NAFClient/src/services/EntityAPI/adminService.ts`
- Modify: `NAFClient/src/services/EntityAPI/implementationService.ts`
- Delete: `NAFClient/src/services/api.tsx`
- Delete: `NAFClient/src/services/EntityAPI/employeeService.ts`
- Delete: `NAFClient/src/services/EntityAPI/resourceService.ts`
- Delete: `NAFClient/src/services/EntityAPI/resourceMetadataService.ts`

- [ ] **Step 1: Write `src/shared/api/client.ts`**

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});
```

- [ ] **Step 2: Write `src/shared/api/employeeService.ts`**

```ts
import { api } from "./client";
import type { Employee } from "@/shared/types/api/employee";

export const searchEmployees = async (match: string): Promise<Employee[]> => {
  try {
    return (await api.get(`/employees/search/${match}`)).data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
```

- [ ] **Step 3: Write `src/shared/api/resourceService.ts`**

```ts
import { api } from "./client";
import type { Resource, ResourceGroup } from "@/shared/types/api/naf";

export const getAllResources = async (): Promise<Resource[]> => {
  try {
    return (await api.get(`/resources`)).data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getResource = async (
  resourceId: number,
): Promise<Resource | null> => {
  try {
    return (await api.get(`/resources/${resourceId}`)).data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getResourceGroups = async (): Promise<ResourceGroup[]> => {
  try {
    return (await api.get(`/ResourceGroups`)).data;
  } catch (error) {
    console.log(error);
    return [];
  }
};
```

- [ ] **Step 4: Write `src/shared/api/resourceMetadataService.ts`**

```ts
import { api } from "./client";
import type {
  InternetPurposeItem,
  InternetResourceItem,
  GroupEmailItem,
  SharedFolderItem,
  AddBasicResourceResult,
} from "@/shared/types/api/naf";

export const getInternetPurposes = async (): Promise<InternetPurposeItem[]> => {
  return (await api.get("/InternetPurposes")).data;
};

export const getInternetResources = async (): Promise<InternetResourceItem[]> => {
  return (await api.get("/InternetResources")).data;
};

export const getGroupEmails = async (): Promise<GroupEmailItem[]> => {
  return (await api.get("/GroupEmails")).data;
};

export const getSharedFolders = async (): Promise<SharedFolderItem[]> => {
  return (await api.get("/SharedFolders")).data;
};

export const createInternetPurpose = async (
  name: string,
  description: string,
): Promise<InternetPurposeItem> => {
  return (await api.post("/InternetPurposes", { name, description })).data;
};

export const createInternetResource = async (
  name: string,
  url: string,
  description: string | null,
  purposeId: number,
): Promise<InternetResourceItem> => {
  return (await api.post("/InternetResources", { name, url, description, purposeId })).data;
};

export const addBasicResourcesToNAF = async (
  nafId: string,
  resources: { id: number; dateNeeded: string }[],
): Promise<AddBasicResourceResult[]> => {
  return (await api.post(`/NAFs/${nafId}/resources/basic`, {
    resources: resources.map((r) => ({
      resourceId: r.id,
      dateNeeded: r.dateNeeded || null,
    })),
  })).data;
};
```

- [ ] **Step 5: Update remaining EntityAPI service files — change their `../api` import to `@/shared/api/client`**

Update `src/services/EntityAPI/nafService.ts` — change line 1:
```ts
import { api } from "@/shared/api/client";
```

Update `src/services/EntityAPI/resourceRequestService.ts` — change line 2:
```ts
import { api } from "@/shared/api/client";
```

Update `src/services/EntityAPI/authService.ts` — change line 1:
```ts
import { api } from "@/shared/api/client";
```

Update `src/services/EntityAPI/adminService.ts` — change line 1:
```ts
import { api } from "@/shared/api/client";
```

Update `src/services/EntityAPI/implementationService.ts` — change line 2:
```ts
import { api } from "@/shared/api/client";
```

- [ ] **Step 6: Update any files that import from the old service paths**

```bash
cd NAFClient
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i 's|@/services/EntityAPI/employeeService|@/shared/api/employeeService|g'
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i 's|@/services/EntityAPI/resourceService|@/shared/api/resourceService|g'
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i 's|@/services/EntityAPI/resourceMetadataService|@/shared/api/resourceMetadataService|g'
```

- [ ] **Step 7: Delete old files**

```bash
rm src/services/api.tsx
rm src/services/EntityAPI/employeeService.ts
rm src/services/EntityAPI/resourceService.ts
rm src/services/EntityAPI/resourceMetadataService.ts
```

- [ ] **Step 8: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: move shared API services to shared/api/"
```

---

### Task 6: Move resource hook

**Files:**
- Create: `NAFClient/src/shared/hooks/useResource.ts`
- Delete: `NAFClient/src/features/resources/`

- [ ] **Step 1: Write `src/shared/hooks/useResource.ts`**

```ts
import {
  getInternetPurposes,
  getInternetResources,
  getGroupEmails,
  getSharedFolders,
} from "@/shared/api/resourceMetadataService";
import { getAllResources } from "@/shared/api/resourceService";
import type {
  InternetPurposeItem,
  InternetResourceItem,
  GroupEmailItem,
  SharedFolderItem,
  Resource,
} from "@/shared/types/api/naf";
import { useQuery } from "@tanstack/react-query";

const STALE_24H = 24 * 60 * 60 * 1000;

export const useResource = () => {
  const getAllResource = useQuery<Resource[], Error>({
    queryKey: ["allResources"],
    queryFn: () => getAllResources(),
    staleTime: STALE_24H,
  });

  return {
    getAllResource,
    isLoading: getAllResource.isLoading,
    isError: getAllResource.isError,
  };
};

export const useResourceMetadata = () => {
  const internetPurposes = useQuery<InternetPurposeItem[], Error>({
    queryKey: ["internetPurposes"],
    queryFn: getInternetPurposes,
    staleTime: STALE_24H,
  });

  const internetResources = useQuery<InternetResourceItem[], Error>({
    queryKey: ["internetResources"],
    queryFn: getInternetResources,
    staleTime: STALE_24H,
  });

  const groupEmails = useQuery<GroupEmailItem[], Error>({
    queryKey: ["groupEmails"],
    queryFn: getGroupEmails,
    staleTime: STALE_24H,
  });

  const sharedFolders = useQuery<SharedFolderItem[], Error>({
    queryKey: ["sharedFolders"],
    queryFn: getSharedFolders,
    staleTime: STALE_24H,
  });

  return {
    internetPurposes,
    internetResources,
    groupEmails,
    sharedFolders,
    isLoading:
      internetPurposes.isLoading ||
      internetResources.isLoading ||
      groupEmails.isLoading ||
      sharedFolders.isLoading,
  };
};
```

- [ ] **Step 2: Update all files importing from the old resource hook path**

```bash
cd NAFClient
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i 's|@/features/resources/hooks/useResource|@/shared/hooks/useResource|g'
```

- [ ] **Step 3: Delete old resources feature folder**

```bash
rm -rf src/features/resources
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with 0 errors.

- [ ] **Step 5: Commit**

```bash
cd ..
git add NAFClient/
git commit -m "refactor: move resource hook to shared/hooks/"
```
