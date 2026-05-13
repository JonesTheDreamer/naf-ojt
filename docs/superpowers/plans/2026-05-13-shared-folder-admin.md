# Shared Folder Admin Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Shared Folder admin section with full CRUD (soft-delete), an owner search input, and an employee access list to the admin UI.

**Architecture:** Extend the existing `SharedFolder` entity with `IsActive`, add admin service methods to `ISharedFolderService`/`SharedFolderService`, expose them via a new `AdminSharedFoldersController`, then build a self-contained frontend feature module at `src/features/shared-folders/`.

**Tech Stack:** ASP.NET Core 8, EF Core + SQL Server (migrations), React 19 + TypeScript, React Query, Tailwind CSS v4, ShadCN, `@/shared/api/client` (axios).

---

## File Map

### Backend — create or modify

| File | Action | Purpose |
|---|---|---|
| `NAFServer/src/Domain/Entities/SharedFolder.cs` | Modify | Add `IsActive` property |
| `NAFServer/Migrations/<ts>_AddIsActiveToSharedFolder.*` | Create (via CLI) | EF migration |
| `NAFServer/src/Application/DTOs/Admin/SharedFolderDTO.cs` | Create | List-item response shape |
| `NAFServer/src/Application/DTOs/Admin/SharedFolderAccessEntryDTO.cs` | Create | Per-employee access row |
| `NAFServer/src/Application/DTOs/Admin/SharedFolderDetailDTO.cs` | Create | Detail page response |
| `NAFServer/src/Application/Interfaces/ISharedFolderService.cs` | Modify | Add 5 admin method signatures |
| `NAFServer/src/Application/Services/SharedFolderService.cs` | Modify | Implement 5 admin methods |
| `NAFServer/src/API/Controllers/AdminSharedFoldersController.cs` | Create | 5 CRUD endpoints |

### Frontend — create or modify

| File | Action | Purpose |
|---|---|---|
| `NAFClient/src/features/shared-folders/types.ts` | Create | TS types |
| `NAFClient/src/features/shared-folders/api.ts` | Create | Axios calls |
| `NAFClient/src/features/shared-folders/hooks/useSharedFolders.ts` | Create | Paginated list query |
| `NAFClient/src/features/shared-folders/hooks/useSharedFolder.ts` | Create | Detail query |
| `NAFClient/src/features/shared-folders/hooks/useSharedFolderMutations.ts` | Create | Create / update / delete mutations |
| `NAFClient/src/features/shared-folders/components/OwnerSearchInput.tsx` | Create | Debounced employee search (name or ID toggle) |
| `NAFClient/src/features/shared-folders/components/SharedFolderFormDialog.tsx` | Create | Create/edit dialog |
| `NAFClient/src/features/shared-folders/components/SharedFolderAccessList.tsx` | Create | Employee access table with progress filter |
| `NAFClient/src/features/shared-folders/pages/SharedFolderListPage.tsx` | Create | List page |
| `NAFClient/src/features/shared-folders/pages/SharedFolderDetailPage.tsx` | Create | Detail page |
| `NAFClient/src/app/routesEnum.ts` | Modify | Add 2 route constants |
| `NAFClient/src/app/router.tsx` | Modify | Add 2 lazy routes |
| `NAFClient/src/shared/components/layout/AdminLayout.tsx` | Modify | Add "Shared Folders" sub-nav item |

---

## Task 1: Add `IsActive` to `SharedFolder` entity + EF migration

**Files:**
- Modify: `NAFServer/src/Domain/Entities/SharedFolder.cs`
- Create: EF migration via `dotnet ef migrations add`

- [ ] **Step 1: Add `IsActive` to the entity**

In `NAFServer/src/Domain/Entities/SharedFolder.cs`, add the property and default it in the constructor:

```csharp
namespace NAFServer.src.Domain.Entities
{
    public class SharedFolder
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? OwnerId { get; set; }
        public bool IsActive { get; set; } = true;

        private SharedFolder() { }

        public SharedFolder(string name, string? ownerId = null)
        {
            Name = name;
            OwnerId = ownerId;
            IsActive = true;
        }

        public SharedFolder SetOwner(string employeeId)
        {
            OwnerId = employeeId;
            return this;
        }

        public SharedFolder Deactivate()
        {
            IsActive = false;
            return this;
        }
    }
}
```

- [ ] **Step 2: Create EF migration**

```bash
cd NAFServer
dotnet ef migrations add AddIsActiveToSharedFolder
```

Expected: new migration files appear in `NAFServer/Migrations/`.

- [ ] **Step 3: Apply migration**

```bash
dotnet ef database update
```

Expected: `Applying migration '..._AddIsActiveToSharedFolder'` in console output.

- [ ] **Step 4: Verify build**

```bash
dotnet build
```

Expected: `Build succeeded. 0 Warning(s) 0 Error(s)`

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Domain/Entities/SharedFolder.cs NAFServer/Migrations/
git commit -m "feat(shared-folders): add IsActive field to SharedFolder entity"
```

---

## Task 2: Backend DTOs

**Files:**
- Create: `NAFServer/src/Application/DTOs/Admin/SharedFolderDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Admin/SharedFolderAccessEntryDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Admin/SharedFolderDetailDTO.cs`

- [ ] **Step 1: Create `SharedFolderDTO.cs`**

```csharp
// NAFServer/src/Application/DTOs/Admin/SharedFolderDTO.cs
namespace NAFServer.src.Application.DTOs.Admin
{
    public record SharedFolderDTO(
        int Id,
        string Name,
        string? OwnerName,
        string? OwnerId,
        bool IsActive
    );
}
```

- [ ] **Step 2: Create `SharedFolderAccessEntryDTO.cs`**

```csharp
// NAFServer/src/Application/DTOs/Admin/SharedFolderAccessEntryDTO.cs
namespace NAFServer.src.Application.DTOs.Admin
{
    public record SharedFolderAccessEntryDTO(
        string EmployeeName,
        string Position,
        string Progress,
        DateTime DateRequested
    );
}
```

- [ ] **Step 3: Create `SharedFolderDetailDTO.cs`**

Uses the generic `PagedResult<T>` helper already in the project. Import from `NAFServer.src.Application.DTOs.Common` (check if a `PagedResult` record exists there; if not, use an inline anonymous type in the service and return `object` from the controller — see Task 3).

```csharp
// NAFServer/src/Application/DTOs/Admin/SharedFolderDetailDTO.cs
using NAFServer.src.Application.DTOs.Admin;

namespace NAFServer.src.Application.DTOs.Admin
{
    public record SharedFolderDetailDTO(
        int Id,
        string Name,
        string? OwnerName,
        string? OwnerId,
        bool IsActive,
        PagedAccessList AccessList
    );

    public record PagedAccessList(
        IEnumerable<SharedFolderAccessEntryDTO> Data,
        int TotalCount,
        int PageSize,
        int CurrentPage,
        int TotalPages
    );
}
```

- [ ] **Step 4: Build to verify**

```bash
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/DTOs/Admin/
git commit -m "feat(shared-folders): add admin DTOs for shared folder CRUD"
```

---

## Task 3: Extend `ISharedFolderService` and `SharedFolderService`

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/ISharedFolderService.cs`
- Modify: `NAFServer/src/Application/Services/SharedFolderService.cs`

- [ ] **Step 1: Add method signatures to the interface**

Replace the content of `NAFServer/src/Application/Interfaces/ISharedFolderService.cs`:

```csharp
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface ISharedFolderService
    {
        Task<List<SharedFolderItemDTO>> GetAllAsync();
        Task<SharedFolder> FindOrCreateAsync(string name);

        // Admin
        Task<(IEnumerable<SharedFolderDTO> Items, int TotalCount)> AdminListAsync(string? search, int page);
        Task<SharedFolderDetailDTO?> AdminDetailAsync(int id, string? progress, int page);
        Task<SharedFolderDTO> AdminCreateAsync(string name, string? ownerId);
        Task<SharedFolderDTO> AdminUpdateAsync(int id, string name, string? ownerId);
        Task AdminDeleteAsync(int id);
    }
}
```

- [ ] **Step 2: Implement the admin methods in `SharedFolderService.cs`**

Replace the full file content:

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Admin;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Helper;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Infrastructure.Persistence.Repositories;

namespace NAFServer.src.Application.Services
{
    public class SharedFolderService : ISharedFolderService
    {
        private readonly ISharedFolderRepository _repo;
        private readonly AppDbContext _context;
        private readonly CacheService _cache;
        private readonly IEmployeeRepository _employeeRepo;
        private const int AdminPageSize = 10;

        public SharedFolderService(
            ISharedFolderRepository repo,
            AppDbContext context,
            CacheService cache,
            IEmployeeRepository employeeRepo)
        {
            _repo = repo;
            _context = context;
            _cache = cache;
            _employeeRepo = employeeRepo;
        }

        public async Task<List<SharedFolderItemDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new SharedFolderItemDTO(i.Id, i.Name)).ToList();
        }

        public async Task<SharedFolder> FindOrCreateAsync(string name)
        {
            var existing = await _context.SharedFolders
                .FirstOrDefaultAsync(f => f.Name.ToLower() == name.ToLower());
            if (existing != null) return existing;

            var created = new SharedFolder(name);
            _context.SharedFolders.Add(created);
            await _context.SaveChangesAsync();
            _cache.Remove(SharedFolderRepository.AllKey);
            return created;
        }

        // --- Admin methods ---

        public async Task<(IEnumerable<SharedFolderDTO> Items, int TotalCount)> AdminListAsync(string? search, int page)
        {
            var query = _context.SharedFolders.Where(f => f.IsActive);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(f => f.Name.Contains(search));

            var totalCount = await query.CountAsync();
            var folders = await query
                .OrderBy(f => f.Name)
                .Skip((page - 1) * AdminPageSize)
                .Take(AdminPageSize)
                .ToListAsync();

            var dtos = new List<SharedFolderDTO>();
            foreach (var f in folders)
            {
                string? ownerName = null;
                if (f.OwnerId != null)
                {
                    var emp = await _employeeRepo.GetByIdAsync(f.OwnerId);
                    ownerName = emp != null ? $"{emp.FirstName} {emp.LastName}".Trim() : f.OwnerId;
                }
                dtos.Add(new SharedFolderDTO(f.Id, f.Name, ownerName, f.OwnerId, f.IsActive));
            }

            return (dtos, totalCount);
        }

        public async Task<SharedFolderDetailDTO?> AdminDetailAsync(int id, string? progress, int page)
        {
            var folder = await _context.SharedFolders.FindAsync(id);
            if (folder == null) return null;

            string? ownerName = null;
            if (folder.OwnerId != null)
            {
                var ownerEmp = await _employeeRepo.GetByIdAsync(folder.OwnerId);
                ownerName = ownerEmp != null ? $"{ownerEmp.FirstName} {ownerEmp.LastName}".Trim() : folder.OwnerId;
            }

            var accessQuery = _context.SharedFolderRequestInfos
                .Where(sfri => sfri.SharedFolderId == id)
                .Join(
                    _context.ResourceRequests,
                    sfri => sfri.ResourceRequestId,
                    rr => rr.Id,
                    (sfri, rr) => new { rr.Progress, rr.NAFId, rr.CreatedAt }
                )
                .Join(
                    _context.NAFs,
                    x => x.NAFId,
                    naf => naf.Id,
                    (x, naf) => new { x.Progress, naf.EmployeeId, x.CreatedAt }
                );

            if (!string.IsNullOrWhiteSpace(progress) && !progress.Equals("all", StringComparison.OrdinalIgnoreCase))
                accessQuery = accessQuery.Where(x => x.Progress.ToString() == progress.ToUpper());

            var totalCount = await accessQuery.CountAsync();
            var rows = await accessQuery
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * AdminPageSize)
                .Take(AdminPageSize)
                .ToListAsync();

            var entries = new List<SharedFolderAccessEntryDTO>();
            foreach (var row in rows)
            {
                var emp = await _employeeRepo.GetByIdAsync(row.EmployeeId);
                var empName = emp != null ? $"{emp.FirstName} {emp.LastName}".Trim() : row.EmployeeId;
                var position = emp?.Position ?? "";
                entries.Add(new SharedFolderAccessEntryDTO(empName, position, row.Progress.ToString(), row.CreatedAt));
            }

            var accessList = new PagedAccessList(
                entries,
                totalCount,
                AdminPageSize,
                page,
                (int)Math.Ceiling(totalCount / (double)AdminPageSize)
            );

            return new SharedFolderDetailDTO(folder.Id, folder.Name, ownerName, folder.OwnerId, folder.IsActive, accessList);
        }

        public async Task<SharedFolderDTO> AdminCreateAsync(string name, string? ownerId)
        {
            var folder = new SharedFolder(name, ownerId);
            _context.SharedFolders.Add(folder);
            await _context.SaveChangesAsync();
            _cache.Remove(SharedFolderRepository.AllKey);

            string? ownerName = null;
            if (ownerId != null)
            {
                var emp = await _employeeRepo.GetByIdAsync(ownerId);
                ownerName = emp != null ? $"{emp.FirstName} {emp.LastName}".Trim() : ownerId;
            }
            return new SharedFolderDTO(folder.Id, folder.Name, ownerName, folder.OwnerId, folder.IsActive);
        }

        public async Task<SharedFolderDTO> AdminUpdateAsync(int id, string name, string? ownerId)
        {
            var folder = await _context.SharedFolders.FindAsync(id)
                ?? throw new KeyNotFoundException($"SharedFolder {id} not found.");

            folder.Name = name;
            folder.OwnerId = ownerId;
            await _context.SaveChangesAsync();
            _cache.Remove(SharedFolderRepository.AllKey);

            string? ownerName = null;
            if (ownerId != null)
            {
                var emp = await _employeeRepo.GetByIdAsync(ownerId);
                ownerName = emp != null ? $"{emp.FirstName} {emp.LastName}".Trim() : ownerId;
            }
            return new SharedFolderDTO(folder.Id, folder.Name, ownerName, folder.OwnerId, folder.IsActive);
        }

        public async Task AdminDeleteAsync(int id)
        {
            var folder = await _context.SharedFolders.FindAsync(id)
                ?? throw new KeyNotFoundException($"SharedFolder {id} not found.");

            folder.Deactivate();
            await _context.SaveChangesAsync();
            _cache.Remove(SharedFolderRepository.AllKey);
        }
    }
}
```

- [ ] **Step 3: Check that `IEmployeeRepository` has `GetByIdAsync` and that `Employee` has `Position`**

The existing service files (e.g., `ResourceRequestApprovalStepService`) already call `_employeeRepo.GetByIdAsync`. The `Employee` entity is returned from stored procedures — check `sp_GetEmployeeDetails` or the Employee model for a `Position` field. If the field is named differently (e.g., `JobTitle`), update the `position` assignment in `AdminDetailAsync` accordingly.

Run:
```bash
grep -r "Position\|JobTitle" NAFServer/src/Domain/Entities/Employee.cs
```

Adjust the property access in `SharedFolderService` to match.

- [ ] **Step 4: Build**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/Interfaces/ISharedFolderService.cs \
        NAFServer/src/Application/Services/SharedFolderService.cs
git commit -m "feat(shared-folders): implement admin CRUD methods in SharedFolderService"
```

---

## Task 4: `AdminSharedFoldersController`

**Files:**
- Create: `NAFServer/src/API/Controllers/AdminSharedFoldersController.cs`

- [ ] **Step 1: Create the controller**

```csharp
// NAFServer/src/API/Controllers/AdminSharedFoldersController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.API.Controllers
{
    [Route("api/admin/shared-folders")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class AdminSharedFoldersController : ControllerBase
    {
        private readonly ISharedFolderService _service;

        public AdminSharedFoldersController(ISharedFolderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] string? search,
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            var (items, totalCount) = await _service.AdminListAsync(search, page);
            const int pageSize = 10;
            return Ok(new
            {
                data = items,
                totalCount,
                pageSize,
                currentPage = page,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> Detail(
            int id,
            [FromQuery] string? progress,
            [FromQuery][Range(1, int.MaxValue)] int page = 1)
        {
            var detail = await _service.AdminDetailAsync(id, progress, page);
            if (detail == null) return NotFound();
            return Ok(detail);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SharedFolderWriteDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");

            var result = await _service.AdminCreateAsync(dto.Name, dto.OwnerId);
            return Created($"api/admin/shared-folders/{result.Id}", result);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SharedFolderWriteDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");
            try
            {
                var result = await _service.AdminUpdateAsync(id, dto.Name, dto.OwnerId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.AdminDeleteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }

    public record SharedFolderWriteDTO(string Name, string? OwnerId);
}
```

- [ ] **Step 2: Build**

```bash
cd NAFServer && dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Quick smoke test**

Start the API (`dotnet run`) and call:
```
GET http://localhost:5186/api/admin/shared-folders
```
(use a valid admin JWT). Expect a JSON paged response.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/API/Controllers/AdminSharedFoldersController.cs
git commit -m "feat(shared-folders): add AdminSharedFoldersController with 5 CRUD endpoints"
```

---

## Task 5: Frontend types, API client, and hooks

**Files:**
- Create: `NAFClient/src/features/shared-folders/types.ts`
- Create: `NAFClient/src/features/shared-folders/api.ts`
- Create: `NAFClient/src/features/shared-folders/hooks/useSharedFolders.ts`
- Create: `NAFClient/src/features/shared-folders/hooks/useSharedFolder.ts`
- Create: `NAFClient/src/features/shared-folders/hooks/useSharedFolderMutations.ts`

- [ ] **Step 1: Create `types.ts`**

```typescript
// NAFClient/src/features/shared-folders/types.ts
import type { PagedResult } from "@/shared/types/common/pagedResult";

export interface SharedFolderDTO {
  id: number;
  name: string;
  ownerName: string | null;
  ownerId: string | null;
  isActive: boolean;
}

export interface SharedFolderAccessEntryDTO {
  employeeName: string;
  position: string;
  progress: string;
  dateRequested: string;
}

export interface SharedFolderDetailDTO extends SharedFolderDTO {
  accessList: PagedAccessList;
}

export interface PagedAccessList {
  data: SharedFolderAccessEntryDTO[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface SharedFolderWriteDTO {
  name: string;
  ownerId: string | null;
}
```

- [ ] **Step 2: Create `api.ts`**

```typescript
// NAFClient/src/features/shared-folders/api.ts
import { api } from "@/shared/api/client";
import type { PagedResult } from "@/shared/types/common/pagedResult";
import type { SharedFolderDTO, SharedFolderDetailDTO, SharedFolderWriteDTO } from "./types";

export const sharedFoldersApi = {
  list: (params: { search?: string; page: number }) =>
    api
      .get<PagedResult<SharedFolderDTO>>("/admin/shared-folders", { params })
      .then((r) => r.data),

  detail: (id: number, params: { progress?: string; page: number }) =>
    api
      .get<SharedFolderDetailDTO>(`/admin/shared-folders/${id}`, { params })
      .then((r) => r.data),

  create: (dto: SharedFolderWriteDTO) =>
    api.post<SharedFolderDTO>("/admin/shared-folders", dto).then((r) => r.data),

  update: (id: number, dto: SharedFolderWriteDTO) =>
    api.put<SharedFolderDTO>(`/admin/shared-folders/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/admin/shared-folders/${id}`).then((r) => r.data),
};
```

- [ ] **Step 3: Create `hooks/useSharedFolders.ts`**

```typescript
// NAFClient/src/features/shared-folders/hooks/useSharedFolders.ts
import { useQuery } from "@tanstack/react-query";
import { sharedFoldersApi } from "../api";

export function useSharedFolders(search: string, page: number) {
  return useQuery({
    queryKey: ["admin", "shared-folders", search, page],
    queryFn: () => sharedFoldersApi.list({ search: search || undefined, page }),
  });
}
```

- [ ] **Step 4: Create `hooks/useSharedFolder.ts`**

```typescript
// NAFClient/src/features/shared-folders/hooks/useSharedFolder.ts
import { useQuery } from "@tanstack/react-query";
import { sharedFoldersApi } from "../api";

export function useSharedFolder(id: number, progress: string, page: number) {
  return useQuery({
    queryKey: ["admin", "shared-folders", id, progress, page],
    queryFn: () =>
      sharedFoldersApi.detail(id, {
        progress: progress === "all" ? undefined : progress,
        page,
      }),
    enabled: !!id,
  });
}
```

- [ ] **Step 5: Create `hooks/useSharedFolderMutations.ts`**

```typescript
// NAFClient/src/features/shared-folders/hooks/useSharedFolderMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sharedFoldersApi } from "../api";
import type { SharedFolderWriteDTO } from "../types";

export function useSharedFolderMutations() {
  const qc = useQueryClient();

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "shared-folders"] });

  const createMutation = useMutation({
    mutationFn: (dto: SharedFolderWriteDTO) => sharedFoldersApi.create(dto),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SharedFolderWriteDTO }) =>
      sharedFoldersApi.update(id, dto),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sharedFoldersApi.remove(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}
```

- [ ] **Step 6: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: no type errors in the new files.

- [ ] **Step 7: Commit**

```bash
git add NAFClient/src/features/shared-folders/
git commit -m "feat(shared-folders): add types, api, and React Query hooks"
```

---

## Task 6: `OwnerSearchInput` component

**Files:**
- Create: `NAFClient/src/features/shared-folders/components/OwnerSearchInput.tsx`

The component calls `GET /api/employees/search?q=` (already used in other dialogs). It debounces 300 ms, shows results in a dropdown, and renders the selection as a dismissible chip.

- [ ] **Step 1: Create the component**

```typescript
// NAFClient/src/features/shared-folders/components/OwnerSearchInput.tsx
import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { api } from "@/shared/api/client";

interface EmployeeSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
}

interface OwnerValue {
  id: string;
  name: string;
}

interface OwnerSearchInputProps {
  value: OwnerValue | null;
  onChange: (value: OwnerValue | null) => void;
}

export function OwnerSearchInput({ value, onChange }: OwnerSearchInputProps) {
  const [mode, setMode] = useState<"name" | "id">("name");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmployeeSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<EmployeeSearchResult[]>("/employees/search", {
          params: { q: query, by: mode },
        });
        setResults(res.data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode]);

  const handleSelect = (emp: EmployeeSearchResult) => {
    onChange({ id: emp.id, name: `${emp.firstName} ${emp.lastName}`.trim() });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-input bg-background text-sm">
        <span className="flex-1 truncate">{value.name}</span>
        <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex gap-1">
        {(["name", "id"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setQuery(""); setResults([]); }}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              mode === m
                ? "bg-amber-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            By {m === "name" ? "Name" : "ID"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={mode === "name" ? "Search by name…" : "Search by employee ID…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
        />

        {open && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            <ul className="max-h-48 overflow-y-auto py-1">
              {results.map((emp) => (
                <li key={emp.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(emp)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors"
                  >
                    <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                    <span className="text-xs text-muted-foreground">{emp.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/shared-folders/components/OwnerSearchInput.tsx
git commit -m "feat(shared-folders): add OwnerSearchInput with name/ID toggle and debounced search"
```

---

## Task 7: `SharedFolderFormDialog` component

**Files:**
- Create: `NAFClient/src/features/shared-folders/components/SharedFolderFormDialog.tsx`

- [ ] **Step 1: Create the component**

```typescript
// NAFClient/src/features/shared-folders/components/SharedFolderFormDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OwnerSearchInput } from "./OwnerSearchInput";
import { useSharedFolderMutations } from "../hooks/useSharedFolderMutations";
import type { SharedFolderDTO } from "../types";

interface SharedFolderFormDialogProps {
  trigger: React.ReactNode;
  folder?: SharedFolderDTO;
  onSuccess?: () => void;
}

export function SharedFolderFormDialog({ trigger, folder, onSuccess }: SharedFolderFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState("");

  const { createMutation, updateMutation } = useSharedFolderMutations();
  const isEdit = !!folder;
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setName(folder?.name ?? "");
      setOwner(
        folder?.ownerId && folder?.ownerName
          ? { id: folder.ownerId, name: folder.ownerName }
          : null,
      );
      setError("");
    }
  }, [open, folder]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: folder!.id, dto: { name: name.trim(), ownerId: owner?.id ?? null } });
      } else {
        await createMutation.mutateAsync({ name: name.trim(), ownerId: owner?.id ?? null });
      }
      setOpen(false);
      onSuccess?.();
    } catch {
      setError("Failed to save. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shared Folder" : "New Shared Folder"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Owner <span className="text-muted-foreground font-normal">(optional)</span></label>
            <OwnerSearchInput value={owner} onChange={setOwner} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!name.trim() || isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/shared-folders/components/SharedFolderFormDialog.tsx
git commit -m "feat(shared-folders): add SharedFolderFormDialog (create/edit)"
```

---

## Task 8: `SharedFolderAccessList` component

**Files:**
- Create: `NAFClient/src/features/shared-folders/components/SharedFolderAccessList.tsx`

- [ ] **Step 1: Create the component**

The progress values are the same as in the rest of the app: `OPEN`, `IN_PROGRESS`, `FOR_SCREENING`, `ACCOMPLISHED`, `REJECTED`, `CANCELLED`. The badge colours match existing usage (green = accomplished, red = rejected, amber = in-progress, etc.).

```typescript
// NAFClient/src/features/shared-folders/components/SharedFolderAccessList.tsx
import { Users } from "lucide-react";
import type { SharedFolderAccessEntryDTO } from "../types";

const PROGRESS_TABS = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "FOR_SCREENING", label: "For Screening" },
  { value: "ACCOMPLISHED", label: "Accomplished" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

function progressBadgeClass(progress: string) {
  switch (progress) {
    case "ACCOMPLISHED": return "bg-green-100 text-green-800 border border-green-200";
    case "REJECTED": return "bg-red-100 text-red-700 border border-red-200";
    case "IN_PROGRESS": return "bg-amber-100 text-amber-800 border border-amber-200";
    case "FOR_SCREENING": return "bg-blue-100 text-blue-800 border border-blue-200";
    case "CANCELLED": return "bg-gray-100 text-gray-500 border border-gray-200";
    default: return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

function progressLabel(progress: string) {
  return progress.replace(/_/g, " ");
}

interface SharedFolderAccessListProps {
  entries: SharedFolderAccessEntryDTO[];
  isLoading: boolean;
  activeProgress: string;
  onProgressChange: (value: string) => void;
  totalCount: number;
}

export function SharedFolderAccessList({
  entries,
  isLoading,
  activeProgress,
  onProgressChange,
  totalCount,
}: SharedFolderAccessListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Employees with Access{" "}
          {!isLoading && (
            <span className="text-sm font-normal text-muted-foreground">
              ({totalCount})
            </span>
          )}
        </h2>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PROGRESS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onProgressChange(tab.value)}
            className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeProgress === tab.value
                ? "bg-amber-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <AccessListSkeleton />
        ) : entries.length === 0 ? (
          <AccessListEmpty />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Position</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Progress</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{entry.employeeName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.position || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${progressBadgeClass(entry.progress)}`}>
                      {progressLabel(entry.progress)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(entry.dateRequested).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AccessListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function AccessListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Users className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No employees found</p>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/shared-folders/components/SharedFolderAccessList.tsx
git commit -m "feat(shared-folders): add SharedFolderAccessList with progress filter tabs"
```

---

## Task 9: `SharedFolderListPage`

**Files:**
- Create: `NAFClient/src/features/shared-folders/pages/SharedFolderListPage.tsx`

- [ ] **Step 1: Create the page**

```typescript
// NAFClient/src/features/shared-folders/pages/SharedFolderListPage.tsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, PowerOff } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useSharedFolders } from "../hooks/useSharedFolders";
import { useSharedFolderMutations } from "../hooks/useSharedFolderMutations";
import { SharedFolderFormDialog } from "../components/SharedFolderFormDialog";
import { Button } from "@/components/ui/button";
import { RoutesEnum } from "@/app/routesEnum";
import type { SharedFolderDTO } from "../types";

export default function SharedFolderListPage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<SharedFolderDTO | null>(null);

  const { data, isLoading } = useSharedFolders(search, page);
  const { deleteMutation } = useSharedFolderMutations();

  const handleSearch = useCallback(() => {
    setSearch(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleClearSearch = () => {
    setInputValue("");
    setSearch("");
    setPage(1);
  };

  const handleDeactivate = async (folder: SharedFolderDTO) => {
    await deleteMutation.mutateAsync(folder.id);
    setConfirmDelete(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">Shared Folders</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage shared folders and their access.
            </p>
          </div>
          <SharedFolderFormDialog
            trigger={
              <Button size="sm">
                New Folder
              </Button>
            }
          />
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search folders…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-colors"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <SharedFolderTableSkeleton />
          ) : !data || data.data.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              No shared folders found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((folder) => (
                  <tr
                    key={folder.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() =>
                      navigate(
                        RoutesEnum.ADMIN_SHARED_FOLDER_DETAIL.replace(":id", String(folder.id)),
                      )
                    }
                  >
                    <td className="px-4 py-3 font-medium">{folder.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {folder.ownerName ?? <span className="italic text-muted-foreground/60">No owner</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SharedFolderFormDialog
                          folder={folder}
                          trigger={
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          }
                        />
                        <button
                          type="button"
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Deactivate"
                          onClick={() => setConfirmDelete(folder)}
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <TablePagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            totalCount={data.totalCount}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Deactivate confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl border border-border p-6 shadow-xl max-w-sm w-full space-y-4">
            <p className="font-semibold">Deactivate folder?</p>
            <p className="text-sm text-muted-foreground">
              Deactivate <strong>{confirmDelete.name}</strong>? Existing access requests will not be affected.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => handleDeactivate(confirmDelete)}
              >
                {deleteMutation.isPending ? "Deactivating…" : "Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function SharedFolderTableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/shared-folders/pages/SharedFolderListPage.tsx
git commit -m "feat(shared-folders): add SharedFolderListPage with search, table, and deactivate confirm"
```

---

## Task 10: `SharedFolderDetailPage`

**Files:**
- Create: `NAFClient/src/features/shared-folders/pages/SharedFolderDetailPage.tsx`

- [ ] **Step 1: Create the page**

```typescript
// NAFClient/src/features/shared-folders/pages/SharedFolderDetailPage.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/shared/components/layout/AdminLayout";
import { TablePagination } from "@/features/naf/components/tablePagination";
import { useSharedFolder } from "../hooks/useSharedFolder";
import { SharedFolderFormDialog } from "../components/SharedFolderFormDialog";
import { SharedFolderAccessList } from "../components/SharedFolderAccessList";
import { Button } from "@/components/ui/button";
import { RoutesEnum } from "@/app/routesEnum";

export default function SharedFolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const folderId = Number(id);

  const [activeProgress, setActiveProgress] = useState("all");
  const [accessPage, setAccessPage] = useState(1);

  const { data, isLoading } = useSharedFolder(folderId, activeProgress, accessPage);

  const handleProgressChange = (value: string) => {
    setActiveProgress(value);
    setAccessPage(1);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Loading…</p>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Folder not found.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(RoutesEnum.ADMIN_SHARED_FOLDERS)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Shared Folders
        </button>

        {/* Info card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-amber-500">{data.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Owner:{" "}
                {data.ownerName ? (
                  <span className="font-medium text-foreground">{data.ownerName}</span>
                ) : (
                  <span className="italic">No owner assigned</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Active
              </span>
              <SharedFolderFormDialog
                folder={data}
                trigger={<Button variant="outline" size="sm">Edit</Button>}
              />
            </div>
          </div>
        </div>

        {/* Access list */}
        <SharedFolderAccessList
          entries={data.accessList.data}
          isLoading={false}
          activeProgress={activeProgress}
          onProgressChange={handleProgressChange}
          totalCount={data.accessList.totalCount}
        />

        {data.accessList.totalPages > 1 && (
          <TablePagination
            currentPage={data.accessList.currentPage}
            totalPages={data.accessList.totalPages}
            totalCount={data.accessList.totalCount}
            pageSize={data.accessList.pageSize}
            onPageChange={setAccessPage}
          />
        )}
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd NAFClient && npm run build 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/shared-folders/pages/SharedFolderDetailPage.tsx
git commit -m "feat(shared-folders): add SharedFolderDetailPage with info card and access list"
```

---

## Task 11: Wire up routes and sidebar

**Files:**
- Modify: `NAFClient/src/app/routesEnum.ts`
- Modify: `NAFClient/src/app/router.tsx`
- Modify: `NAFClient/src/shared/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Add route constants to `routesEnum.ts`**

In `NAFClient/src/app/routesEnum.ts`, add inside the enum after `ADMIN_AUDIT_TRAIL`:

```typescript
  ADMIN_SHARED_FOLDERS = "/admin/resources/shared-folders",
  ADMIN_SHARED_FOLDER_DETAIL = "/admin/resources/shared-folders/:id",
```

- [ ] **Step 2: Add lazy imports and routes to `router.tsx`**

Add after the `AuditTrailPage` lazy import:

```typescript
const SharedFolderListPage = lazy(
  () => import("@/features/shared-folders/pages/SharedFolderListPage"),
);
const SharedFolderDetailPage = lazy(
  () => import("@/features/shared-folders/pages/SharedFolderDetailPage"),
);
```

Add after the `ADMIN_AUDIT_TRAIL` route block:

```tsx
<Route
  path={RoutesEnum.ADMIN_SHARED_FOLDERS}
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <SharedFolderListPage />
    </ProtectedRoute>
  }
/>
<Route
  path={RoutesEnum.ADMIN_SHARED_FOLDER_DETAIL}
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <SharedFolderDetailPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: Extend `NavItem` type in `Sidebar.tsx` to support optional className**

`NavItem` is defined in `NAFClient/src/shared/components/layout/Sidebar.tsx`. Add an optional `className` field and pass it to the `<Link>`:

```typescript
export interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
}
```

In the `navItems.map` render, merge `item.className` into the existing `cn(...)` call on the `<Link>`:

```tsx
<Link
  to={item.href}
  className={cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
    item.className,
    isActive
      ? "bg-gray-100 text-gray-900"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  )}
>
```

- [ ] **Step 4: Add sidebar item to `AdminLayout.tsx`**

In `NAFClient/src/shared/components/layout/AdminLayout.tsx`, add `FolderOpen` to the lucide import and a new nav item after "Resources":

```typescript
import { Home, Users, FileText, ClipboardList, Box, Building2, ScrollText, FolderOpen } from "lucide-react";
```

In the `navItems` array, after the `Resources` entry:

```typescript
  { label: "Shared Folders", icon: <FolderOpen className="w-4 h-4" />, href: "/admin/resources/shared-folders", className: "pl-7" },
```

- [ ] **Step 5: Full TypeScript check**

```bash
cd NAFClient && npm run build
```

Expected: `Build succeeded. 0 errors.`

- [ ] **Step 6: Commit**

```bash
git add NAFClient/src/app/routesEnum.ts \
        NAFClient/src/app/router.tsx \
        NAFClient/src/shared/components/layout/AdminLayout.tsx
git commit -m "feat(shared-folders): wire routes and add Shared Folders sidebar link"
```

---

## Task 12: End-to-end smoke test

- [ ] **Step 1: Start the backend**

```bash
cd NAFServer && dotnet run
```

- [ ] **Step 2: Start the frontend**

```bash
cd NAFClient && npm run dev
```

- [ ] **Step 3: Verify list page**

1. Log in as ADMIN.
2. Navigate to `/admin/resources/shared-folders`.
3. Confirm the page loads and shows existing shared folders (from seeder).
4. Type a search term and press Enter — confirm the list filters.

- [ ] **Step 4: Verify create**

Click "New Folder", enter a name, optionally search and select an owner, click "Create". Confirm the new folder appears in the list.

- [ ] **Step 5: Verify edit**

Click the edit icon on a row. Confirm the dialog pre-fills with the folder's current name and owner. Change the name, save, confirm the list updates.

- [ ] **Step 6: Verify deactivate**

Click the deactivate icon on a row. Confirm the confirmation popover appears. Click "Deactivate". Confirm the folder disappears from the list.

- [ ] **Step 7: Verify detail page**

Click a folder row. Confirm the detail page loads with the folder name, owner, and the access list table (possibly empty for new folders). If employees have access, confirm their names and progress badges appear. Change the progress filter tab and confirm the list re-fetches.

- [ ] **Step 8: Verify owner search**

Open the edit dialog for a folder. In the Owner field, click "By Name", type a few letters — confirm the dropdown shows matching employees. Click one — confirm the chip appears. Click the × on the chip — confirm it clears. Switch to "By ID", type an ID prefix — confirm results appear.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(shared-folders): complete shared folder admin feature"
```
