# Group Email & Shared Folder Find-or-Create Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed-list combobox for Group Email and Shared Folder resource request entries with a free-text combobox that finds an existing record or creates a new one on submit.

**Architecture:** Two new `POST /find-or-create` endpoints resolve a string (email or folder name) to an integer ID server-side. The frontend entry cards switch from a numeric-ID combobox to a string-value create-or-select combobox. On submit, `useAddResource` calls find-or-create first, then creates the resource request with the returned ID — the existing handler pipeline is unchanged.

**Tech Stack:** ASP.NET Core 8, EF Core, React 19, TypeScript, TanStack Query v5, ShadCN Command + Popover

---

## File Map

| File | Action |
|------|--------|
| `NAFServer/src/Domain/Entities/GroupEmail.cs` | Remove `DepartmentId` |
| `NAFServer/src/Domain/Entities/SharedFolder.cs` | Remove `DepartmentId`, `Remarks` |
| `NAFServer/src/Infrastructure/Persistence/Seeder/SharedFolderSeeder.cs` | Update constructor calls |
| `NAFServer/src/Application/DTOs/Lookup/GroupEmailDTO.cs` | Remove `DepartmentId` field |
| `NAFServer/src/Application/DTOs/Lookup/SharedFolderItemDTO.cs` | Remove `Remarks`, `DepartmentId` fields |
| `NAFServer/src/Application/DTOs/Lookup/FindOrCreateGroupEmailDTO.cs` | **New** |
| `NAFServer/src/Application/DTOs/Lookup/FindOrCreateSharedFolderDTO.cs` | **New** |
| `NAFServer/src/Application/Interfaces/IGroupEmailService.cs` | Add `FindOrCreateAsync` |
| `NAFServer/src/Application/Interfaces/ISharedFolderService.cs` | Add `FindOrCreateAsync` |
| `NAFServer/src/Application/Services/GroupEmailService.cs` | Implement `FindOrCreateAsync`, update `GetAllAsync` |
| `NAFServer/src/Application/Services/SharedFolderService.cs` | Implement `FindOrCreateAsync`, update `GetAllAsync` |
| `NAFServer/src/API/Controllers/GroupEmailsController.cs` | Add `find-or-create` action |
| `NAFServer/src/API/Controllers/SharedFoldersController.cs` | Add `find-or-create` action |
| `NAFClient/src/features/naf/api.ts` | Add `findOrCreateGroupEmail`, `findOrCreateSharedFolder` |
| `NAFClient/src/features/naf/hooks/useAddResource.ts` | Update entry types + submit logic |
| `NAFClient/src/shared/components/common/CreateOrSelectCombobox.tsx` | **New** |
| `NAFClient/src/features/naf/components/add-resource/GroupEmailEntryCard.tsx` | Rewrite |
| `NAFClient/src/features/naf/components/add-resource/SharedFolderEntryCard.tsx` | Rewrite |
| `NAFClient/src/features/naf/components/add-resource/AddResourceDialog.tsx` | Update prop shapes + validation |

---

## Task 1: Update backend entities and seeder

**Files:**
- Modify: `NAFServer/src/Domain/Entities/GroupEmail.cs`
- Modify: `NAFServer/src/Domain/Entities/SharedFolder.cs`
- Modify: `NAFServer/src/Infrastructure/Persistence/Seeder/SharedFolderSeeder.cs`

- [ ] **Step 1: Replace `GroupEmail.cs`**

```csharp
namespace NAFServer.src.Domain.Entities
{
    public class GroupEmail
    {
        public int Id { get; set; }
        public string Email { get; set; }

        private GroupEmail() { }

        public GroupEmail(string email)
        {
            Email = email;
        }
    }
}
```

- [ ] **Step 2: Replace `SharedFolder.cs`**

```csharp
namespace NAFServer.src.Domain.Entities
{
    public class SharedFolder
    {
        public int Id { get; set; }
        public string Name { get; set; }

        private SharedFolder() { }

        public SharedFolder(string name)
        {
            Name = name;
        }
    }
}
```

- [ ] **Step 3: Update `SharedFolderSeeder.cs`**

Replace the five `new SharedFolder(...)` calls at the top of `SeedAsync`:

```csharp
var ags = new SharedFolder("AGS");
var accounting = new SharedFolder("Accounting");
var commonFileAccounting = new SharedFolder("Common File Accounting");
var audit = new SharedFolder("Audit");
var commonFileAudit = new SharedFolder("Common File Audit");
```

Leave everything else in the file unchanged (the commented-out entries and the `AddRange` call).

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Domain/Entities/GroupEmail.cs
git add NAFServer/src/Domain/Entities/SharedFolder.cs
git add NAFServer/src/Infrastructure/Persistence/Seeder/SharedFolderSeeder.cs
git commit -m "refactor: remove DepartmentId/Remarks from GroupEmail and SharedFolder entities"
```

---

## Task 2: Update lookup DTOs and create find-or-create DTOs

**Files:**
- Modify: `NAFServer/src/Application/DTOs/Lookup/GroupEmailDTO.cs`
- Modify: `NAFServer/src/Application/DTOs/Lookup/SharedFolderItemDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Lookup/FindOrCreateGroupEmailDTO.cs`
- Create: `NAFServer/src/Application/DTOs/Lookup/FindOrCreateSharedFolderDTO.cs`

- [ ] **Step 1: Update `GroupEmailDTO.cs`**

Replace the entire file:

```csharp
namespace NAFServer.src.Application.DTOs.Lookup
{
    public record GroupEmailDTO(int Id, string Email);
}
```

- [ ] **Step 2: Update `SharedFolderItemDTO.cs`**

Replace the entire file:

```csharp
namespace NAFServer.src.Application.DTOs.Lookup
{
    public record SharedFolderItemDTO(int Id, string Name);
}
```

- [ ] **Step 3: Create `FindOrCreateGroupEmailDTO.cs`**

```csharp
namespace NAFServer.src.Application.DTOs.Lookup
{
    public record FindOrCreateGroupEmailDTO(string Email);
}
```

- [ ] **Step 4: Create `FindOrCreateSharedFolderDTO.cs`**

```csharp
namespace NAFServer.src.Application.DTOs.Lookup
{
    public record FindOrCreateSharedFolderDTO(string Name);
}
```

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/DTOs/Lookup/
git commit -m "refactor: slim GroupEmailDTO and SharedFolderItemDTO, add find-or-create DTOs"
```

---

## Task 3: Add `FindOrCreateAsync` to service interfaces and implementations

**Files:**
- Modify: `NAFServer/src/Application/Interfaces/IGroupEmailService.cs`
- Modify: `NAFServer/src/Application/Interfaces/ISharedFolderService.cs`
- Modify: `NAFServer/src/Application/Services/GroupEmailService.cs`
- Modify: `NAFServer/src/Application/Services/SharedFolderService.cs`

- [ ] **Step 1: Update `IGroupEmailService.cs`**

```csharp
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface IGroupEmailService
    {
        Task<List<GroupEmailDTO>> GetAllAsync();
        Task<GroupEmail> FindOrCreateAsync(string email);
    }
}
```

- [ ] **Step 2: Update `ISharedFolderService.cs`**

```csharp
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface ISharedFolderService
    {
        Task<List<SharedFolderItemDTO>> GetAllAsync();
        Task<SharedFolder> FindOrCreateAsync(string name);
    }
}
```

- [ ] **Step 3: Replace `GroupEmailService.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class GroupEmailService : IGroupEmailService
    {
        private readonly IGroupEmailRepository _repo;
        private readonly AppDbContext _context;

        public GroupEmailService(IGroupEmailRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<List<GroupEmailDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new GroupEmailDTO(i.Id, i.Email)).ToList();
        }

        public async Task<GroupEmail> FindOrCreateAsync(string email)
        {
            var existing = await _context.GroupEmails
                .FirstOrDefaultAsync(g => g.Email.ToLower() == email.ToLower());
            if (existing != null) return existing;

            var created = new GroupEmail(email);
            _context.GroupEmails.Add(created);
            await _context.SaveChangesAsync();
            return created;
        }
    }
}
```

- [ ] **Step 4: Replace `SharedFolderService.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class SharedFolderService : ISharedFolderService
    {
        private readonly ISharedFolderRepository _repo;
        private readonly AppDbContext _context;

        public SharedFolderService(ISharedFolderRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
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
            return created;
        }
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/Interfaces/IGroupEmailService.cs
git add NAFServer/src/Application/Interfaces/ISharedFolderService.cs
git add NAFServer/src/Application/Services/GroupEmailService.cs
git add NAFServer/src/Application/Services/SharedFolderService.cs
git commit -m "feat: add FindOrCreateAsync to GroupEmailService and SharedFolderService"
```

---

## Task 4: Add find-or-create endpoints to controllers

**Files:**
- Modify: `NAFServer/src/API/Controllers/GroupEmailsController.cs`
- Modify: `NAFServer/src/API/Controllers/SharedFoldersController.cs`

- [ ] **Step 1: Replace `GroupEmailsController.cs`**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class GroupEmailsController : ControllerBase
    {
        private readonly IGroupEmailService _service;

        public GroupEmailsController(IGroupEmailService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
            => Ok(await _service.GetAllAsync());

        [HttpPost("find-or-create")]
        public async Task<IActionResult> FindOrCreate([FromBody] FindOrCreateGroupEmailDTO dto)
        {
            var result = await _service.FindOrCreateAsync(dto.Email);
            return Ok(new GroupEmailDTO(result.Id, result.Email));
        }
    }
}
```

- [ ] **Step 2: Replace `SharedFoldersController.cs`**

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;

namespace NAFServer.src.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class SharedFoldersController : ControllerBase
    {
        private readonly ISharedFolderService _service;

        public SharedFoldersController(ISharedFolderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
            => Ok(await _service.GetAllAsync());

        [HttpPost("find-or-create")]
        public async Task<IActionResult> FindOrCreate([FromBody] FindOrCreateSharedFolderDTO dto)
        {
            var result = await _service.FindOrCreateAsync(dto.Name);
            return Ok(new SharedFolderItemDTO(result.Id, result.Name));
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/GroupEmailsController.cs
git add NAFServer/src/API/Controllers/SharedFoldersController.cs
git commit -m "feat: add POST find-or-create endpoints for GroupEmails and SharedFolders"
```

---

## Task 5: Build and verify the backend compiles

**Files:** (none modified)

- [ ] **Step 1: Build from `NAFServer/`**

```bash
cd NAFServer
dotnet build
```

Expected: `Build succeeded` with 0 errors. If you see errors about `DepartmentId` or `Remarks` in any file not listed in this plan (e.g., mapping files or other services), remove those field references — they no longer exist on the entity.

- [ ] **Step 2: Commit if any additional fixes were needed**

```bash
git add -A
git commit -m "fix: remove remaining DepartmentId/Remarks references after entity cleanup"
```

---

## Task 6: Add find-or-create API functions to the frontend

**Files:**
- Modify: `NAFClient/src/features/naf/api.ts`

- [ ] **Step 1: Add two new functions to `api.ts`**

Add after the `claimScreeningStep` function at the bottom of the file:

```ts
export const findOrCreateGroupEmail = async (
  email: string,
): Promise<{ id: number; email: string }> =>
  (await api.post("/GroupEmails/find-or-create", { email })).data;

export const findOrCreateSharedFolder = async (
  name: string,
): Promise<{ id: number; name: string }> =>
  (await api.post("/SharedFolders/find-or-create", { name })).data;
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/features/naf/api.ts
git commit -m "feat: add findOrCreateGroupEmail and findOrCreateSharedFolder API functions"
```

---

## Task 7: Update entry types and submit logic in `useAddResource.ts`

**Files:**
- Modify: `NAFClient/src/features/naf/hooks/useAddResource.ts`

- [ ] **Step 1: Update the imports at the top of `useAddResource.ts`**

Add `findOrCreateGroupEmail` and `findOrCreateSharedFolder` to the import from `"../api"`:

```ts
import {
  createResourceRequest,
  findOrCreateGroupEmail,
  findOrCreateSharedFolder,
} from "../api";
```

- [ ] **Step 2: Replace the `GroupEmailEntry` and `SharedFolderEntry` type definitions**

Find and replace:

```ts
export type GroupEmailEntry = {
  _id: string;
  groupEmailId: number | null;
  purpose: string;
  dateNeeded: string;
};

export type SharedFolderEntry = {
  _id: string;
  sharedFolderId: number | null;
  purpose: string;
  dateNeeded: string;
};
```

With:

```ts
export type GroupEmailEntry = {
  _id: string;
  email: string;
  isNew: boolean;
  purpose: string;
  dateNeeded: string;
};

export type SharedFolderEntry = {
  _id: string;
  name: string;
  isNew: boolean;
  purpose: string;
  dateNeeded: string;
};
```

- [ ] **Step 3: Replace the group email submit block**

Find:

```ts
params.groupEmailEntries.forEach((entry) => {
  specialTasks.push(
    createResourceRequest({
      nafId: params.nafId,
      resourceId: GROUP_EMAIL_RESOURCE_ID,
      purpose: entry.purpose,
      additionalInfo: { GroupEmailId: entry.groupEmailId! },
      dateNeeded: entry.dateNeeded || null,
    })
      .then(() => {
        anySuccess = true;
      })
      .catch((e: unknown) => {
        const axiosData = (e as { response?: { data?: string } })?.response?.data;
        const msg = axiosData ?? (e instanceof Error ? e.message : "Unknown error");
        errors.push(`Group email: ${msg}`);
      }),
  );
});
```

Replace with:

```ts
params.groupEmailEntries.forEach((entry) => {
  specialTasks.push(
    findOrCreateGroupEmail(entry.email.trim())
      .then(({ id }) =>
        createResourceRequest({
          nafId: params.nafId,
          resourceId: GROUP_EMAIL_RESOURCE_ID,
          purpose: entry.purpose,
          additionalInfo: { GroupEmailId: id },
          dateNeeded: entry.dateNeeded || null,
        }),
      )
      .then(() => {
        anySuccess = true;
      })
      .catch((e: unknown) => {
        const axiosData = (e as { response?: { data?: string } })?.response?.data;
        const msg = axiosData ?? (e instanceof Error ? e.message : "Unknown error");
        errors.push(`Group email: ${msg}`);
      }),
  );
});
```

- [ ] **Step 4: Replace the shared folder submit block**

Find:

```ts
params.sharedFolderEntries.forEach((entry) => {
  specialTasks.push(
    createResourceRequest({
      nafId: params.nafId,
      resourceId: SHARED_FOLDER_RESOURCE_ID,
      purpose: entry.purpose,
      additionalInfo: { SharedFolderId: entry.sharedFolderId! },
      dateNeeded: entry.dateNeeded || null,
    })
      .then(() => {
        anySuccess = true;
      })
      .catch((e: unknown) => {
        const axiosData = (e as { response?: { data?: string } })?.response?.data;
        const msg = axiosData ?? (e instanceof Error ? e.message : "Unknown error");
        errors.push(`Shared folder: ${msg}`);
      }),
  );
});
```

Replace with:

```ts
params.sharedFolderEntries.forEach((entry) => {
  specialTasks.push(
    findOrCreateSharedFolder(entry.name.trim())
      .then(({ id }) =>
        createResourceRequest({
          nafId: params.nafId,
          resourceId: SHARED_FOLDER_RESOURCE_ID,
          purpose: entry.purpose,
          additionalInfo: { SharedFolderId: id },
          dateNeeded: entry.dateNeeded || null,
        }),
      )
      .then(() => {
        anySuccess = true;
      })
      .catch((e: unknown) => {
        const axiosData = (e as { response?: { data?: string } })?.response?.data;
        const msg = axiosData ?? (e instanceof Error ? e.message : "Unknown error");
        errors.push(`Shared folder: ${msg}`);
      }),
  );
});
```

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/features/naf/hooks/useAddResource.ts
git commit -m "feat: update GroupEmailEntry and SharedFolderEntry types, wire find-or-create in submit"
```

---

## Task 8: Create `CreateOrSelectCombobox` component

**Files:**
- Create: `NAFClient/src/shared/components/common/CreateOrSelectCombobox.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/utils";

interface CreateOrSelectComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string, isNew: boolean) => void;
  placeholder?: string;
}

export function CreateOrSelectCombobox({
  options,
  value,
  onChange,
  placeholder = "Search or enter new...",
}: CreateOrSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(input.toLowerCase()),
  );

  const exactMatch = options.some(
    (o) => o.toLowerCase() === input.toLowerCase(),
  );

  const showCreate = input.trim().length > 0 && !exactMatch;

  const handleSelect = (selected: string, isNew: boolean) => {
    onChange(selected, isNew);
    setInput("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={input}
            onValueChange={setInput}
          />
          <CommandList>
            {filtered.map((option) => (
              <CommandGroup key="existing">
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option, false)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option}
                </CommandItem>
              </CommandGroup>
            ))}
            {showCreate && (
              <CommandGroup key="create">
                <CommandItem
                  value={`__create__${input}`}
                  onSelect={() => handleSelect(input.trim(), true)}
                >
                  <Plus className="mr-2 h-4 w-4 text-amber-500" />
                  Use{" "}
                  <span className="font-semibold mx-1">"{input.trim()}"</span>
                  <span className="text-xs text-amber-600">(new)</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFClient/src/shared/components/common/CreateOrSelectCombobox.tsx
git commit -m "feat: add CreateOrSelectCombobox shared component"
```

---

## Task 9: Rewrite `GroupEmailEntryCard` and `SharedFolderEntryCard`

**Files:**
- Modify: `NAFClient/src/features/naf/components/add-resource/GroupEmailEntryCard.tsx`
- Modify: `NAFClient/src/features/naf/components/add-resource/SharedFolderEntryCard.tsx`

- [ ] **Step 1: Replace `GroupEmailEntryCard.tsx`**

```tsx
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/shared/utils/utils";
import { CreateOrSelectCombobox } from "@/shared/components/common/CreateOrSelectCombobox";
import type { GroupEmailEntry } from "../../hooks/useAddResource";

interface GroupEmailEntryCardProps {
  entry: GroupEmailEntry;
  allGroupEmails: { id: number; email: string }[];
  usedEmails: string[];
  onChange: (patch: Partial<GroupEmailEntry>) => void;
  onRemove: () => void;
}

export function GroupEmailEntryCard({
  entry,
  allGroupEmails,
  usedEmails,
  onChange,
  onRemove,
}: GroupEmailEntryCardProps) {
  const options = allGroupEmails
    .filter((g) => !usedEmails.map((e) => e.toLowerCase()).includes(g.email.toLowerCase()))
    .map((g) => g.email);

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FieldLabel>Group Email</FieldLabel>
          {entry.email && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                entry.isNew
                  ? "bg-amber-50 border border-amber-200 text-amber-700"
                  : "bg-blue-50 border border-blue-200 text-blue-700",
              )}
            >
              {entry.isNew ? "New" : "Existing"}
            </span>
          )}
        </div>
        <CreateOrSelectCombobox
          options={options}
          value={entry.email}
          onChange={(val, isNew) => onChange({ email: val, isNew })}
          placeholder="Search or enter email..."
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

- [ ] **Step 2: Replace `SharedFolderEntryCard.tsx`**

```tsx
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/shared/utils/utils";
import { CreateOrSelectCombobox } from "@/shared/components/common/CreateOrSelectCombobox";
import type { SharedFolderEntry } from "../../hooks/useAddResource";

interface SharedFolderEntryCardProps {
  entry: SharedFolderEntry;
  allSharedFolders: { id: number; name: string }[];
  usedNames: string[];
  onChange: (patch: Partial<SharedFolderEntry>) => void;
  onRemove: () => void;
}

export function SharedFolderEntryCard({
  entry,
  allSharedFolders,
  usedNames,
  onChange,
  onRemove,
}: SharedFolderEntryCardProps) {
  const options = allSharedFolders
    .filter((f) => !usedNames.map((n) => n.toLowerCase()).includes(f.name.toLowerCase()))
    .map((f) => f.name);

  return (
    <div className="border rounded-md p-3 space-y-2 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FieldLabel>Shared Folder</FieldLabel>
          {entry.name && (
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                entry.isNew
                  ? "bg-amber-50 border border-amber-200 text-amber-700"
                  : "bg-blue-50 border border-blue-200 text-blue-700",
              )}
            >
              {entry.isNew ? "New" : "Existing"}
            </span>
          )}
        </div>
        <CreateOrSelectCombobox
          options={options}
          value={entry.name}
          onChange={(val, isNew) => onChange({ name: val, isNew })}
          placeholder="Search or enter folder name..."
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

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/naf/components/add-resource/GroupEmailEntryCard.tsx
git add NAFClient/src/features/naf/components/add-resource/SharedFolderEntryCard.tsx
git commit -m "feat: rewrite GroupEmailEntryCard and SharedFolderEntryCard with create-or-select combobox"
```

---

## Task 10: Update `AddResourceDialog` — props, validation, metadata types

**Files:**
- Modify: `NAFClient/src/features/naf/components/add-resource/AddResourceDialog.tsx`

- [ ] **Step 1: Update initial entry factories**

Find:
```ts
const addGroupEmailEntry = () =>
  setGroupEmailEntries((prev) => [...prev, { _id: newEntry(), groupEmailId: null, purpose: "", dateNeeded: "" }]);

const addSharedFolderEntry = () =>
  setSharedFolderEntries((prev) => [...prev, { _id: newEntry(), sharedFolderId: null, purpose: "", dateNeeded: "" }]);
```

Replace with:
```ts
const addGroupEmailEntry = () =>
  setGroupEmailEntries((prev) => [...prev, { _id: newEntry(), email: "", isNew: false, purpose: "", dateNeeded: "" }]);

const addSharedFolderEntry = () =>
  setSharedFolderEntries((prev) => [...prev, { _id: newEntry(), name: "", isNew: false, purpose: "", dateNeeded: "" }]);
```

- [ ] **Step 2: Update completion validation**

Find:
```ts
const isGroupEmailEntryComplete = (e: GroupEmailEntry) => e.groupEmailId !== null && e.purpose.trim().length > 0;
const isSharedFolderEntryComplete = (e: SharedFolderEntry) => e.sharedFolderId !== null && e.purpose.trim().length > 0;
```

Replace with:
```ts
const isGroupEmailEntryComplete = (e: GroupEmailEntry) => e.email.trim().length > 0 && e.purpose.trim().length > 0;
const isSharedFolderEntryComplete = (e: SharedFolderEntry) => e.name.trim().length > 0 && e.purpose.trim().length > 0;
```

- [ ] **Step 3: Update `usedGroupEmailIds` → `usedGroupEmails` (string deduplication)**

Find:
```ts
const usedGroupEmailIds = naf.resourceRequests
  .filter((rr) => rr.additionalInfo?.type === 2 && rr.progress === Progress.ACCOMPLISHED)
  .map((rr) => (rr.additionalInfo as GroupEmailInfo).groupEmailId);
```

Replace with:
```ts
const usedGroupEmails = naf.resourceRequests
  .filter((rr) => rr.additionalInfo?.type === 2)
  .map((rr) => (rr.additionalInfo as GroupEmailInfo).email);
```

- [ ] **Step 4: Update `usedSharedFolderIds` → `usedSharedFolderNames` (string deduplication)**

Find:
```ts
const usedSharedFolderIds = naf.resourceRequests
  .filter((rr) => rr.additionalInfo?.type === 1 && rr.progress === Progress.ACCOMPLISHED)
  .map((rr) => (rr.additionalInfo as SharedFolderInfo).sharedFolderId);
```

Replace with:
```ts
const usedSharedFolderNames = naf.resourceRequests
  .filter((rr) => rr.additionalInfo?.type === 1)
  .map((rr) => (rr.additionalInfo as SharedFolderInfo).name);
```

- [ ] **Step 5: Update `GroupEmailEntryCard` props in JSX**

Find:
```tsx
<GroupEmailEntryCard
  key={entry._id}
  entry={entry}
  allGroupEmails={groupEmails.data ?? []}
  usedGroupEmailIds={[...usedGroupEmailIds, ...groupEmailEntries.filter((e) => e._id !== entry._id && e.groupEmailId !== null).map((e) => e.groupEmailId!)]}
  onChange={(patch) => patchGroupEmailEntry(entry._id, patch)}
  onRemove={() => setGroupEmailEntries((prev) => prev.filter((e) => e._id !== entry._id))}
/>
```

Replace with:
```tsx
<GroupEmailEntryCard
  key={entry._id}
  entry={entry}
  allGroupEmails={groupEmails.data ?? []}
  usedEmails={[
    ...usedGroupEmails,
    ...groupEmailEntries
      .filter((e) => e._id !== entry._id && e.email.trim().length > 0)
      .map((e) => e.email),
  ]}
  onChange={(patch) => patchGroupEmailEntry(entry._id, patch)}
  onRemove={() => setGroupEmailEntries((prev) => prev.filter((e) => e._id !== entry._id))}
/>
```

- [ ] **Step 6: Update `SharedFolderEntryCard` props in JSX**

Find:
```tsx
<SharedFolderEntryCard
  key={entry._id}
  entry={entry}
  allSharedFolders={sharedFolders.data ?? []}
  usedSharedFolderIds={[...usedSharedFolderIds, ...sharedFolderEntries.filter((e) => e._id !== entry._id && e.sharedFolderId !== null).map((e) => e.sharedFolderId!)]}
  onChange={(patch) => patchSharedFolderEntry(entry._id, patch)}
  onRemove={() => setSharedFolderEntries((prev) => prev.filter((e) => e._id !== entry._id))}
/>
```

Replace with:
```tsx
<SharedFolderEntryCard
  key={entry._id}
  entry={entry}
  allSharedFolders={sharedFolders.data ?? []}
  usedNames={[
    ...usedSharedFolderNames,
    ...sharedFolderEntries
      .filter((e) => e._id !== entry._id && e.name.trim().length > 0)
      .map((e) => e.name),
  ]}
  onChange={(patch) => patchSharedFolderEntry(entry._id, patch)}
  onRemove={() => setSharedFolderEntries((prev) => prev.filter((e) => e._id !== entry._id))}
/>
```

- [ ] **Step 7: Update the `useResourceMetadata` return type**

Run the following to find the hook file:
```bash
grep -r "useResourceMetadata" NAFClient/src --include="*.ts" --include="*.tsx" -l
```

Open the hook file (likely `NAFClient/src/shared/hooks/useResource.ts`). Find the type for `groupEmails` query data — it will reference `{ id: number; email: string; departmentId: string }`. Remove `departmentId`. Find the type for `sharedFolders` query data — it references `{ id: number; name: string; departmentId: string; remarks: string }`. Remove `departmentId` and `remarks`.

The exact change depends on how the hook types its responses. Common patterns:

If using explicit type annotation:
```ts
// before
const groupEmails = useQuery<{ id: number; email: string; departmentId: string }[]>({ ... });
const sharedFolders = useQuery<{ id: number; name: string; departmentId: string; remarks: string }[]>({ ... });

// after
const groupEmails = useQuery<{ id: number; email: string }[]>({ ... });
const sharedFolders = useQuery<{ id: number; name: string }[]>({ ... });
```

If the types are inferred from a service function return type, update that service function's return type annotation instead.

- [ ] **Step 8: Commit**

```bash
git add NAFClient/src/features/naf/components/add-resource/AddResourceDialog.tsx
git add NAFClient/src/shared/hooks/useResource.ts   # adjust path if different
git commit -m "feat: update AddResourceDialog to use string-based group email and shared folder entries"
```

---

## Task 11: Build the frontend and fix any TypeScript errors

**Files:** (none modified directly)

- [ ] **Step 1: Build from `NAFClient/`**

```bash
cd NAFClient
npm run build
```

Expected: `✓ built` with no TypeScript errors.

Common errors you may see and how to fix them:

**"`groupEmailId` does not exist on type `GroupEmailEntry`"** — Search for any remaining use of `entry.groupEmailId` or `entry.sharedFolderId` in the codebase and replace with `entry.email` / `entry.name`.

**"`departmentId` does not exist"** — A component or type still references the removed field. Remove it from the type definition and any JSX that reads it.

**"`usedGroupEmailIds` is not assignable"** — A call site still passes the old prop name. Update to `usedEmails`.

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors after group email and shared folder refactor"
```
