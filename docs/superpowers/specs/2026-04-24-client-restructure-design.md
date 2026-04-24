# Client-Side Folder Restructure Design

## Goal

Restructure the React/TypeScript frontend from a loosely organized mix of flat folders into a feature-slice architecture with clear separation of concerns. Includes breaking up oversized components into focused files.

## Approach

Feature-by-feature (Approach C): take one feature at a time, create its new folder layout, extract shared pieces into `shared/`, decompose large files, update all imports, verify the app still builds before moving to the next feature.

---

## Target Folder Structure

```
src/
  app/
    router.tsx          ← unchanged
    queryClient.ts      ← unchanged
    routesEnum.ts       ← unchanged
  features/
    auth/
      components/
      hooks/
      api.ts
      context.tsx       ← AuthContext moved here (contents unchanged)
      index.ts
    naf/
      components/
        resource-request/   ← extracted from resourceRequestAccordion.tsx
        add-resource/       ← extracted from addResourceDialog.tsx
        (remaining components)
      hooks/
      pages/
      api.ts
      index.ts
    admin/
      components/           ← includes former tech/ components
      hooks/
      pages/                ← ForImplementationsPage + admin pages
      api.ts
      index.ts
  shared/
    components/
      ui/               ← ShadCN (untouched, path alias unchanged)
      layout/           ← AdminLayout, Header, Sidebar
      common/           ← global/component/ + SearchableCombobox
    hooks/
      use-mobile.ts
    utils/
      utils.ts          ← lib/utils.ts
      dateUrgency.ts    ← lib/dateUrgency.ts
    types/
      api/              ← types/api/
      common/           ← types/common/
      enum/             ← types/enum/
    api/
      client.ts         ← services/api.tsx (Axios instance)
      employeeService.ts
      resourceService.ts
      resourceMetadataService.ts
  assets/
  main.tsx
```

---

## Migration Order

1. **`shared/`** — Move types, utils, axios client, cross-feature services. Update all import paths site-wide.
2. **`auth` feature** — Move AuthContext, create api.ts, index.ts.
3. **`naf` feature** — Move pages/hooks/components, decompose large files.
4. **`admin` feature** — Move admin pages, absorb former `tech/` feature.

---

## Component Decomposition

### `resourceRequestAccordion.tsx` (1010 lines) → `naf/components/resource-request/`

| File | Contents |
|---|---|
| `ResourceRequestAccordionItem.tsx` | Main export, orchestrator (~150 lines after extraction) |
| `ResourceRequestContent.tsx` | PurposeBlock, AdditionalInfoBlock, HistoryTable, ImplementationBlock |
| `ResourceRequestActions.tsx` | OpenActions, RejectedActions, ApproverActions, ReminderAction, DeactivateAction |
| `ApproveDialog.tsx` | ApproveDialog extracted |
| `RejectDialog.tsx` | RejectDialog extracted |
| `ChangeResourceDialog.tsx` | ChangeResourceDialog extracted |
| `resourceRequestUtils.ts` | formatDateTime, ACTION_CONFIG constants |
| `index.ts` | Re-exports ResourceRequestAccordionItem |

### `addResourceDialog.tsx` (851 lines) → `naf/components/add-resource/`

| File | Contents |
|---|---|
| `AddResourceDialog.tsx` | Main dialog, orchestrator (~150 lines after extraction) |
| `BasicResourceSection.tsx` | Checkbox list for basic resources |
| `InternetEntryCard.tsx` | Internet access entry card |
| `GroupEmailEntryCard.tsx` | Group email entry card |
| `SharedFolderEntryCard.tsx` | Shared folder entry card |
| `index.ts` | Re-exports AddResourceDialog |

`SearchableCombobox` (generic combobox used inside add-resource) moves to `shared/components/common/SearchableCombobox.tsx`.

### `ViewNAFDetail.tsx` (452 lines)

Split into:
- `ViewNAFDetail.tsx` — page orchestrator (~100 lines)
- `NAFDetailHeader.tsx` — summary/title section
- `ResourceRequestList.tsx` — accordion list rendering

---

## Feature Conventions

### `api.ts`
Raw API call functions only — no React Query. Imports `client` from `shared/api/client.ts`.

```ts
// features/naf/api.ts
import { client } from "@/shared/api/client";
export const getNAFById = (id: string) => client.get(`/nafs/${id}`);
```

### `hooks/`
React Query wrappers over `api.ts`. The only layer pages and components import data from. Existing hooks adjust imports only — no logic changes.

### `context.tsx`
Feature-level UI state shared across a feature's components. Only `auth` needs this (AuthContext). `naf` and `admin` have no feature context — React Query covers all their state.

### `index.ts`
Public barrel export. Components outside the feature import from here, not from deep paths.

```ts
// features/naf/index.ts
export { ViewAllNAF } from "./pages/ViewAllNAF";
export { ViewNAFDetail } from "./pages/ViewNAFDetail";
```

---

## Shared API Layer

Services that are used by multiple features move to `shared/api/`:

| File | Source |
|---|---|
| `client.ts` | `services/api.tsx` |
| `employeeService.ts` | `services/EntityAPI/employeeService.ts` |
| `resourceService.ts` | `services/EntityAPI/resourceService.ts` |
| `resourceMetadataService.ts` | `services/EntityAPI/resourceMetadataService.ts` |

Feature-specific services move into their feature's `api.ts`:

| Service | Destination |
|---|---|
| `nafService` + `resourceRequestService` | `features/naf/api.ts` |
| `authService` | `features/auth/api.ts` |
| `adminService` + `implementationService` | `features/admin/api.ts` |

The `features/resources/hooks/useResource.ts` hook (used by `addResourceDialog`) moves to `shared/hooks/useResource.ts` since resources are referenced across features.

---

## Import Path Changes

| Old path | New path |
|---|---|
| `@/lib/utils` | `@/shared/utils/utils` |
| `@/lib/dateUrgency` | `@/shared/utils/dateUrgency` |
| `@/components/layout/` | `@/shared/components/layout/` |
| `@/global/component/` | `@/shared/components/common/` |
| `@/types/` | `@/shared/types/` |
| `@/services/api` | `@/shared/api/client` |
| `@/services/EntityAPI/employeeService` | `@/shared/api/employeeService` |
| `@/services/EntityAPI/resourceService` | `@/shared/api/resourceService` |
| `@/services/EntityAPI/resourceMetadataService` | `@/shared/api/resourceMetadataService` |
| `@/components/ui/` | No change needed — handled by vite alias (see below) |

> **ShadCN alias strategy:** `vite.config.ts` currently maps `@` → `src/`. After moving `src/components/` → `src/shared/components/`, add a second alias so ShadCN imports keep working without any find-replace:
> ```ts
> // vite.config.ts — add inside resolve.alias
> "@/components": path.resolve(__dirname, "./src/shared/components"),
> ```
> This alias is more specific than `@` and wins. All `@/components/ui/button` etc. imports resolve to `src/shared/components/ui/button` automatically.
