# Auth Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the `auth` feature so its API calls live in `features/auth/api.ts` and add a barrel `index.ts`. No logic changes — only file moves and import path updates.

**Architecture:** The auth feature already has most of its files in place (`AuthContext.tsx`, `ProtectedRoute.tsx`, `pages/`). This plan extracts the raw API calls from the old `authService.ts` into `features/auth/api.ts`, updates two import sites (AuthContext and the login pages), and cleans up the orphaned service file.

**Tech Stack:** React 19, TypeScript, Vite

**Prerequisite:** Run this plan AFTER `2026-04-24-restructure-shared.md` is complete.

---

## File Map

| Source | Destination |
|--------|-------------|
| `src/services/EntityAPI/authService.ts` | `src/features/auth/api.ts` (content copied; old file deleted) |
| `src/features/auth/AuthContext.tsx` | same path, import updated |
| `src/features/auth/pages/AdminLoginPage.tsx` | same path, import updated |
| `src/features/auth/pages/RequestorLoginPage.tsx` | same path, import updated |
| `src/features/auth/pages/TechTeamLoginPage.tsx` | same path, import updated |
| — | `src/features/auth/index.ts` (new) |

---

### Task 1: Create `features/auth/api.ts`

**Files:**
- Create: `NAFClient/src/features/auth/api.ts`

- [ ] **Step 1: Write `src/features/auth/api.ts`**

```ts
import { api } from "@/shared/api/client";
import type { AuthUser, LoginRequest } from "@/shared/types/api/auth";

export const authApi = {
  loginAdmin: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login/admin", data).then((r) => r.data),

  loginTechnicalTeam: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login/technical-team", data).then((r) => r.data),

  loginRequestorApprover: (data: LoginRequest) =>
    api.post<AuthUser>("/auth/login/requestor-approver", data).then((r) => r.data),

  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),
};
```

> Note: the export is renamed from `authService` to `authApi` to match the feature-level naming convention. All usages will be updated in the next steps.

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds (old authService.ts still exists and is still imported by other files).

---

### Task 2: Update AuthContext.tsx

**Files:**
- Modify: `NAFClient/src/features/auth/AuthContext.tsx`

- [ ] **Step 1: Update the import and usage in `AuthContext.tsx`**

Replace:
```ts
import { authService } from "@/services/EntityAPI/authService";
```
With:
```ts
import { authApi } from "./api";
```

Replace all occurrences of `authService.` with `authApi.` in that file (there are two: `authService.me()` and `authService.logout()`).

The updated file:
```ts
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/shared/types/api/auth";
import { authApi } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    console.log(user);
  }, [user]);

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

---

### Task 3: Update login pages

**Files:**
- Modify: `NAFClient/src/features/auth/pages/AdminLoginPage.tsx`
- Modify: `NAFClient/src/features/auth/pages/RequestorLoginPage.tsx`
- Modify: `NAFClient/src/features/auth/pages/TechTeamLoginPage.tsx`

- [ ] **Step 1: Find all auth login pages that import `authService`**

```bash
cd NAFClient
grep -rl "authService\|EntityAPI/authService" src/features/auth/pages --include="*.tsx"
```

- [ ] **Step 2: For each file found, replace the import and usage**

Replace:
```ts
import { authService } from "@/services/EntityAPI/authService";
```
With:
```ts
import { authApi } from "../api";
```

Then replace all `authService.loginAdmin(` → `authApi.loginAdmin(`, `authService.loginTechnicalTeam(` → `authApi.loginTechnicalTeam(`, `authService.loginRequestorApprover(` → `authApi.loginRequestorApprover(` in each file.

- [ ] **Step 3: Verify build passes**

```bash
cd NAFClient && npm run build
```

Expected: Build succeeds.

---

### Task 4: Delete old authService.ts

**Files:**
- Delete: `NAFClient/src/services/EntityAPI/authService.ts`

- [ ] **Step 1: Confirm no remaining imports of the old path**

```bash
cd NAFClient
grep -r "EntityAPI/authService" src --include="*.ts" --include="*.tsx"
```

Expected: No output (zero matches).

- [ ] **Step 2: Delete the file**

```bash
rm src/services/EntityAPI/authService.ts
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds.

---

### Task 5: Create `features/auth/index.ts`

**Files:**
- Create: `NAFClient/src/features/auth/index.ts`

- [ ] **Step 1: Write `src/features/auth/index.ts`**

```ts
export { AuthProvider, useAuth } from "./AuthContext";
export { ProtectedRoute } from "./ProtectedRoute";
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
git commit -m "refactor: consolidate auth feature — add api.ts and index.ts"
```
