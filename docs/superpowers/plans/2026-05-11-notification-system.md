# Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-time in-app notification system using SignalR — a bell icon in the shared header shows an unread count badge and a popover panel; notifications are stored in the DB and pushed live.

**Architecture:** A `Notification` table stores records per user. `NotificationService` creates records and pushes them via `IHubContext<NotificationHub>`. Integration points in existing services call `INotificationService` after their core logic. The frontend holds a persistent SignalR connection, prepends arriving notifications to the React Query cache, and loads the initial list via REST on mount.

**Tech Stack:** ASP.NET Core 8 SignalR, EF Core 8, Microsoft.AspNetCore.SignalR.Client (`@microsoft/signalr` on frontend), TanStack React Query, Radix UI Popover primitive.

---

## File Map

### New Backend
| File | Responsibility |
|------|----------------|
| `NAFServer/src/Domain/Entities/Notification.cs` | Entity — Guid Id, int UserId, string Title/Message/Link, bool IsRead, DateTime CreatedAt |
| `NAFServer/src/Domain/Interface/Repository/INotificationRepository.cs` | Repository contract |
| `NAFServer/src/Infrastructure/Persistence/Repositories/NotificationRepository.cs` | EF Core implementation |
| `NAFServer/src/Application/DTOs/Notification/NotificationDTO.cs` | Wire DTO — matches frontend shape |
| `NAFServer/src/Application/Interfaces/INotificationService.cs` | Service contract (includes public helper methods used by integration points) |
| `NAFServer/src/Application/Services/NotificationService.cs` | Saves records + SignalR push + recipient resolution helpers |
| `NAFServer/src/API/Hubs/NotificationHub.cs` | SignalR hub — on connect, joins `user-{userId}` group |
| `NAFServer/src/API/Controllers/NotificationsController.cs` | REST: GET mine, PUT read, PUT read-all |

### Modified Backend
| File | Change |
|------|--------|
| `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs` | Add `DbSet<Notification>` + FK config |
| `NAFServer/Program.cs` | AddSignalR, register two new services, MapHub |
| `NAFServer/src/Application/Services/NAFService.cs` | Call `INotificationService` after CreateAsync commits |
| `NAFServer/src/Application/Services/ResourceRequestApprovalStepService.cs` | Call after ApproveStepAsync and RejectStepAsync |
| `NAFServer/src/Application/Services/AdminService.cs` | Call after CreateUserAsync |
| `NAFServer/src/Application/Services/ResourceManagementService.cs` | Call after CreateResourceAsync and AddWorkflowTemplateAsync |

### New Frontend
| File | Responsibility |
|------|----------------|
| `NAFClient/src/features/notifications/types.ts` | `NotificationDTO` interface + response type |
| `NAFClient/src/features/notifications/api.ts` | `getMyNotifications`, `markAsRead`, `markAllAsRead` |
| `NAFClient/src/features/notifications/hooks/useNotifications.ts` | SignalR connection + React Query + exposed state |
| `NAFClient/src/features/notifications/components/NotificationBell.tsx` | Bell + badge + Radix Popover panel |

### Modified Frontend
| File | Change |
|------|--------|
| `NAFClient/src/shared/components/layout/Header.tsx` | Import and render `<NotificationBell />` |

---

## Task 1: Notification Entity

**Files:**
- Create: `NAFServer/src/Domain/Entities/Notification.cs`

- [ ] **Step 1: Create the entity**

```csharp
// NAFServer/src/Domain/Entities/Notification.cs
namespace NAFServer.src.Domain.Entities
{
    public class Notification
    {
        public Guid Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Link { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public User User { get; set; }

        private Notification() { }

        public Notification(int userId, string title, string message, string link)
        {
            UserId = userId;
            Title = title;
            Message = message;
            Link = link;
            IsRead = false;
            CreatedAt = DateTime.UtcNow;
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFServer/src/Domain/Entities/Notification.cs
git commit -m "feat(notifications): add Notification entity"
```

---

## Task 2: AppDbContext + EF Migration

**Files:**
- Modify: `NAFServer/src/Infrastructure/Persistence/AppDbContext.cs`

- [ ] **Step 1: Add DbSet and FK config**

In `AppDbContext.cs`, add the DbSet after the existing `DbSet<Location>` line:

```csharp
public DbSet<Notification> Notifications { get; set; }
```

In `OnModelCreating`, after the `User` → `UserLocations` relationship block (around line 178), add:

```csharp
modelBuilder.Entity<Notification>()
    .HasOne(n => n.User)
    .WithMany()
    .HasForeignKey(n => n.UserId)
    .OnDelete(DeleteBehavior.Cascade);
```

- [ ] **Step 2: Create and apply the EF migration**

```bash
cd NAFServer
dotnet ef migrations add AddNotifications
dotnet ef database update
```

Expected: migration file created in `NAFServer/Migrations/`, database updated with `Notifications` table.

- [ ] **Step 3: Verify the build**

```bash
dotnet build
```

Expected: Build succeeded, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Infrastructure/Persistence/AppDbContext.cs NAFServer/Migrations/
git commit -m "feat(notifications): add Notifications table via EF migration"
```

---

## Task 3: INotificationRepository + NotificationRepository

**Files:**
- Create: `NAFServer/src/Domain/Interface/Repository/INotificationRepository.cs`
- Create: `NAFServer/src/Infrastructure/Persistence/Repositories/NotificationRepository.cs`

- [ ] **Step 1: Create the interface**

```csharp
// NAFServer/src/Domain/Interface/Repository/INotificationRepository.cs
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface INotificationRepository
    {
        Task<Notification> CreateAsync(Notification notification);
        Task<List<Notification>> GetByUserIdAsync(int userId, int page, int pageSize);
        Task<int> GetCountAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task MarkAsReadAsync(Guid id, int userId);
        Task MarkAllAsReadAsync(int userId);
    }
}
```

- [ ] **Step 2: Create the implementation**

```csharp
// NAFServer/src/Infrastructure/Persistence/Repositories/NotificationRepository.cs
using Microsoft.EntityFrameworkCore;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Infrastructure.Persistence.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AppDbContext _context;

        public NotificationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Notification> CreateAsync(Notification notification)
        {
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            return notification;
        }

        public async Task<List<Notification>> GetByUserIdAsync(int userId, int page, int pageSize)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderBy(n => n.IsRead)
                .ThenByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetCountAsync(int userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId);
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task MarkAsReadAsync(Guid id, int userId)
        {
            await _context.Notifications
                .Where(n => n.Id == id && n.UserId == userId)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        }
    }
}
```

- [ ] **Step 3: Build to catch errors**

```bash
cd NAFServer
dotnet build
```

Expected: Build succeeded.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Domain/Interface/Repository/INotificationRepository.cs NAFServer/src/Infrastructure/Persistence/Repositories/NotificationRepository.cs
git commit -m "feat(notifications): add INotificationRepository and NotificationRepository"
```

---

## Task 4: NotificationDTO

**Files:**
- Create: `NAFServer/src/Application/DTOs/Notification/NotificationDTO.cs`

- [ ] **Step 1: Create the DTO**

```csharp
// NAFServer/src/Application/DTOs/Notification/NotificationDTO.cs
namespace NAFServer.src.Application.DTOs.Notification
{
    public record NotificationDTO(
        Guid Id,
        string Title,
        string Message,
        string Link,
        bool IsRead,
        DateTime CreatedAt
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add NAFServer/src/Application/DTOs/Notification/NotificationDTO.cs
git commit -m "feat(notifications): add NotificationDTO"
```

---

## Task 5: INotificationService + NotificationService

**Files:**
- Create: `NAFServer/src/Application/Interfaces/INotificationService.cs`
- Create: `NAFServer/src/Application/Services/NotificationService.cs`

- [ ] **Step 1: Create the interface**

The helper methods are public on the interface because the integration points (NAFService, AdminService, etc.) need them to resolve recipients before calling `CreateForUsersAsync`.

```csharp
// NAFServer/src/Application/Interfaces/INotificationService.cs
namespace NAFServer.src.Application.Interfaces
{
    public interface INotificationService
    {
        Task CreateForUsersAsync(List<int> userIds, string title, string message, string link);
        Task MarkAsReadAsync(Guid id, int userId);
        Task MarkAllAsReadAsync(int userId);
        Task<List<int>> GetAdminsByLocationAsync(int locationId);
        Task<List<int>> GetAllAdminsAsync();
        Task<int?> FindUserIdByEmployeeNumberAsync(string? employeeNumber);
    }
}
```

- [ ] **Step 2: Create the service**

```csharp
// NAFServer/src/Application/Services/NotificationService.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NAFServer.src.API.Hubs;
using NAFServer.src.Application.DTOs.Notification;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Enums;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;

namespace NAFServer.src.Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly AppDbContext _context;

        public NotificationService(
            INotificationRepository notificationRepository,
            IHubContext<NotificationHub> hubContext,
            AppDbContext context)
        {
            _notificationRepository = notificationRepository;
            _hubContext = hubContext;
            _context = context;
        }

        public async Task CreateForUsersAsync(List<int> userIds, string title, string message, string link)
        {
            foreach (var userId in userIds.Distinct())
            {
                var notification = new Notification(userId, title, message, link);
                await _notificationRepository.CreateAsync(notification);

                var dto = new NotificationDTO(notification.Id, title, message, link, false, notification.CreatedAt);
                await _hubContext.Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", dto);
            }
        }

        public async Task MarkAsReadAsync(Guid id, int userId)
        {
            await _notificationRepository.MarkAsReadAsync(id, userId);
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            await _notificationRepository.MarkAllAsReadAsync(userId);
        }

        public async Task<List<int>> GetAdminsByLocationAsync(int locationId)
        {
            var adminUserIds = await _context.UserRoles
                .Where(ur => ur.IsActive && ur.Role.Name == Roles.ADMIN)
                .Select(ur => ur.UserId)
                .ToListAsync();

            return await _context.UserLocations
                .Where(ul => ul.LocationId == locationId && ul.IsActive && adminUserIds.Contains(ul.UserId))
                .Select(ul => ul.UserId)
                .Distinct()
                .ToListAsync();
        }

        public async Task<List<int>> GetAllAdminsAsync()
        {
            return await _context.UserRoles
                .Where(ur => ur.IsActive && ur.Role.Name == Roles.ADMIN)
                .Select(ur => ur.UserId)
                .Distinct()
                .ToListAsync();
        }

        public async Task<int?> FindUserIdByEmployeeNumberAsync(string? employeeNumber)
        {
            if (string.IsNullOrEmpty(employeeNumber)) return null;
            return await _context.Users
                .Where(u => u.EmployeeNumber == employeeNumber)
                .Select(u => (int?)u.Id)
                .FirstOrDefaultAsync();
        }
    }
}
```

**Note:** `NotificationHub` is referenced here before it is created in Task 6. This causes a compile error until Task 6 is done. Add a placeholder class in Task 6 first, or create both tasks together. The `using NAFServer.src.API.Hubs;` import is fine once Task 6 is done.

- [ ] **Step 3: Commit (after Task 6 hub is created)**

Hold this commit until Task 6 is complete, then:

```bash
git add NAFServer/src/Application/Interfaces/INotificationService.cs NAFServer/src/Application/Services/NotificationService.cs
git commit -m "feat(notifications): add INotificationService and NotificationService"
```

---

## Task 6: NotificationHub

**Files:**
- Create: `NAFServer/src/API/Hubs/NotificationHub.cs`

- [ ] **Step 1: Create the hub directory and file**

```csharp
// NAFServer/src/API/Hubs/NotificationHub.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NAFServer.src.Domain.Interface.Repository;
using System.Security.Claims;

namespace NAFServer.src.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly IUserRepository _userRepository;

        public NotificationHub(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public override async Task OnConnectedAsync()
        {
            var employeeId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (employeeId != null)
            {
                try
                {
                    var user = await _userRepository.GetUserByEmployeeId(employeeId);
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{user.Id}");
                }
                catch (KeyNotFoundException) { }
            }
            await base.OnConnectedAsync();
        }
    }
}
```

- [ ] **Step 2: Build to confirm no compile errors**

```bash
cd NAFServer
dotnet build
```

Expected: Build succeeded.

- [ ] **Step 3: Commit Tasks 5 and 6 together**

```bash
git add NAFServer/src/Application/Interfaces/INotificationService.cs NAFServer/src/Application/Services/NotificationService.cs NAFServer/src/API/Hubs/NotificationHub.cs
git commit -m "feat(notifications): add NotificationService and NotificationHub"
```

---

## Task 7: NotificationsController

**Files:**
- Create: `NAFServer/src/API/Controllers/NotificationsController.cs`

The controller returns a custom `NotificationsPagedResultDTO` (defined inline) that extends `PagedResult<NotificationDTO>` with `unreadCount`.

- [ ] **Step 1: Create the controller**

```csharp
// NAFServer/src/API/Controllers/NotificationsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NAFServer.src.Application.DTOs.Notification;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using System.Security.Claims;

namespace NAFServer.src.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserRepository _userRepository;

        public NotificationsController(
            INotificationService notificationService,
            INotificationRepository notificationRepository,
            IUserRepository userRepository)
        {
            _notificationService = notificationService;
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
        }

        private async Task<int> GetCurrentUserIdAsync()
        {
            var employeeId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var user = await _userRepository.GetUserByEmployeeId(employeeId);
            return user.Id;
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMyNotifications([FromQuery] int page = 1)
        {
            const int pageSize = 20;
            var userId = await GetCurrentUserIdAsync();

            var notifications = await _notificationRepository.GetByUserIdAsync(userId, page, pageSize);
            var totalCount = await _notificationRepository.GetCountAsync(userId);
            var unreadCount = await _notificationRepository.GetUnreadCountAsync(userId);

            var dtos = notifications.Select(n =>
                new NotificationDTO(n.Id, n.Title, n.Message, n.Link, n.IsRead, n.CreatedAt)
            ).ToList();

            return Ok(new
            {
                data = dtos,
                totalCount,
                pageSize,
                currentPage = page,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                unreadCount
            });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = await GetCurrentUserIdAsync();
            await _notificationService.MarkAsReadAsync(id, userId);
            return NoContent();
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = await GetCurrentUserIdAsync();
            await _notificationService.MarkAllAsReadAsync(userId);
            return NoContent();
        }
    }
}
```

- [ ] **Step 2: Build**

```bash
cd NAFServer
dotnet build
```

Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add NAFServer/src/API/Controllers/NotificationsController.cs
git commit -m "feat(notifications): add NotificationsController"
```

---

## Task 8: Program.cs Wiring

**Files:**
- Modify: `NAFServer/Program.cs`

- [ ] **Step 1: Add SignalR and new services**

In `Program.cs`, add after the existing service registrations (after line `builder.Services.AddScoped<IUserRoleService, UserRoleService>();`):

```csharp
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
```

Also add the missing `using` directives at the top of `Program.cs`:

```csharp
using NAFServer.src.API.Hubs;
using NAFServer.src.Application.DTOs.Notification;
```

- [ ] **Step 2: Map the hub**

In `Program.cs`, after `app.MapControllers();`, add:

```csharp
app.MapHub<NotificationHub>("/hubs/notifications");
```

The final section should look like:

```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.Run();
```

- [ ] **Step 3: Build and run**

```bash
cd NAFServer
dotnet build
dotnet run
```

Expected: Server starts, Swagger UI shows `/api/notifications/mine` endpoint, no errors in console.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/Program.cs
git commit -m "feat(notifications): wire SignalR hub and notification services in Program.cs"
```

---

## Task 9: Integration — NAFService

**Files:**
- Modify: `NAFServer/src/Application/Services/NAFService.cs`

When a NAF is created, notify: all admins at the NAF's location + the requestor's supervisor (if a registered user) + the requestor's department head (if a registered user). Link: `/admin/NAF/{nafId}`.

- [ ] **Step 1: Inject INotificationService into NAFService constructor**

Add to `NAFService.cs` field declarations (after `ICurrentUserService`):

```csharp
private readonly INotificationService _notificationService;
```

Add to the constructor parameter list:

```csharp
INotificationService notificationService
```

Add to the constructor body:

```csharp
_notificationService = notificationService;
```

The full constructor signature (showing just the new param added):
```csharp
public NAFService(
    AppDbContext context,
    IEmployeeRepository employeeRepository,
    INAFRepository nafRepository,
    IApprovalWorkflowTemplateRepository approvalWorkflowTemplateRepository,
    IApprovalWorkflowStepsTemplateRepository approvalWorkflowStepsTemplateRepository,
    IDepartmentRepository departmentRepository,
    IResourceRequestService resourceRequestService,
    IResourceRepository resourceRepository,
    IResourceRequestHandlerRegistry resourceRequestHandlerRegistry,
    IUserRepository userRepository,
    IUserLocationRepository userLocationRepository,
    IUserDepartmentRepository userDepartmentRepository,
    ICurrentUserService currentUserService,
    IConfiguration configuration,
    INotificationService notificationService  // ← new
)
```

- [ ] **Step 2: Add notification call in CreateAsync, after `await transaction.CommitAsync()`**

In the `CreateAsync` method, after `await transaction.CommitAsync();`, before the `var nafDto = ...` lines:

```csharp
// Notify admins + supervisor + dept head about new NAF
try
{
    var adminIds = await _notificationService.GetAdminsByLocationAsync(naf.LocationId);
    var supervisorId = await _notificationService.FindUserIdByEmployeeNumberAsync(employee.SupervisorId);
    var deptHeadId = await _notificationService.FindUserIdByEmployeeNumberAsync(employee.DepartmentHeadId);

    var recipientIds = new HashSet<int>(adminIds);
    if (supervisorId.HasValue) recipientIds.Add(supervisorId.Value);
    if (deptHeadId.HasValue) recipientIds.Add(deptHeadId.Value);

    if (recipientIds.Count > 0)
    {
        await _notificationService.CreateForUsersAsync(
            recipientIds.ToList(),
            "New NAF Submitted",
            $"A new NAF has been submitted for {employee.FirstName} {employee.LastName}.",
            $"/admin/NAF/{naf.Id}"
        );
    }
}
catch { }
```

The `try/catch` prevents notification failures from breaking the NAF creation flow.

- [ ] **Step 3: Build**

```bash
cd NAFServer
dotnet build
```

Expected: Build succeeded.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Services/NAFService.cs
git commit -m "feat(notifications): notify on NAF created"
```

---

## Task 10: Integration — ResourceRequestApprovalStepService

**Files:**
- Modify: `NAFServer/src/Application/Services/ResourceRequestApprovalStepService.cs`

**Approve:** notify requestor (`/NAF/{nafId}`) + next approver if not final step (`/admin/NAF/{nafId}`).  
**Reject:** notify requestor (`/NAF/{nafId}`).

- [ ] **Step 1: Inject INotificationService**

Add field:
```csharp
private readonly INotificationService _notificationService;
```

Update constructor signature (add new param):
```csharp
public ResourceRequestApprovalStepService(
    AppDbContext context,
    IResourceRequestStepRepository resourceRequestStepRepository,
    IResourceRequestRepository resourceRequestRepository,
    IEmployeeRepository employeeRepository,
    INotificationService notificationService)  // ← new
{
    _context = context;
    _resourceRequestStepRepository = resourceRequestStepRepository;
    _resourceRequestRepository = resourceRequestRepository;
    _employeeRepository = employeeRepository;
    _notificationService = notificationService;
}
```

- [ ] **Step 2: Add notification in ApproveStepAsync after `await _context.SaveChangesAsync()`**

After `await _context.SaveChangesAsync();` in `ApproveStepAsync`, before `return step;`:

```csharp
// Notify requestor
try
{
    var requestorUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(rr.NAF.RequestorId);
    if (requestorUserId.HasValue)
    {
        await _notificationService.CreateForUsersAsync(
            new List<int> { requestorUserId.Value },
            "Resource Request Approved",
            "Your resource request has been approved.",
            $"/NAF/{rr.NAFId}"
        );
    }

    // Notify next approver (only if not all steps are accomplished)
    if (!rr.IsAccomplished())
    {
        var nextStep = rr.ResourceRequestsApprovalSteps
            .FirstOrDefault(s => s.StepOrder == rr.CurrentStep);
        if (nextStep?.ApproverId != null)
        {
            var nextApproverId = await _notificationService.FindUserIdByEmployeeNumberAsync(nextStep.ApproverId);
            if (nextApproverId.HasValue && nextApproverId.Value != requestorUserId)
            {
                await _notificationService.CreateForUsersAsync(
                    new List<int> { nextApproverId.Value },
                    "Resource Request Awaiting Your Approval",
                    "A resource request requires your approval.",
                    $"/admin/NAF/{rr.NAFId}"
                );
            }
        }
    }
}
catch { }
```

- [ ] **Step 3: Add notification in RejectStepAsync after `await _context.SaveChangesAsync()`**

After `await _context.SaveChangesAsync();` in `RejectStepAsync`, before `return step;`:

```csharp
// Notify requestor
try
{
    var requestorUserId = await _notificationService.FindUserIdByEmployeeNumberAsync(rr.NAF.RequestorId);
    if (requestorUserId.HasValue)
    {
        await _notificationService.CreateForUsersAsync(
            new List<int> { requestorUserId.Value },
            "Resource Request Rejected",
            "Your resource request has been rejected.",
            $"/NAF/{rr.NAFId}"
        );
    }
}
catch { }
```

- [ ] **Step 4: Build**

```bash
cd NAFServer
dotnet build
```

Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/Services/ResourceRequestApprovalStepService.cs
git commit -m "feat(notifications): notify on resource request approve/reject"
```

---

## Task 11: Integration — AdminService

**Files:**
- Modify: `NAFServer/src/Application/Services/AdminService.cs`

When a user is created, notify all admins at the new user's location. Link: `/admin/users/{userId}`.

- [ ] **Step 1: Inject INotificationService**

Add field:
```csharp
private readonly INotificationService _notificationService;
```

Update constructor:
```csharp
public AdminService(
    IUserRepository userRepository,
    IUserRoleRepository userRoleRepository,
    IUserLocationRepository userLocationRepository,
    IUserDepartmentRepository userDepartmentRepository,
    IEmployeeRepository employeeRepository,
    IRoleRepository roleRepository,
    INotificationService notificationService)  // ← new
{
    _userRepository = userRepository;
    _userRoleRepository = userRoleRepository;
    _userLocationRepository = userLocationRepository;
    _userDepartmentRepository = userDepartmentRepository;
    _employeeRepository = employeeRepository;
    _roleRepository = roleRepository;
    _notificationService = notificationService;
}
```

- [ ] **Step 2: Add notification at the end of CreateUserAsync, before the closing brace**

In `CreateUserAsync`, after the role assignment block:

```csharp
// Notify admins at the location
try
{
    var adminIds = await _notificationService.GetAdminsByLocationAsync(dto.LocationId);
    if (adminIds.Count > 0)
    {
        await _notificationService.CreateForUsersAsync(
            adminIds,
            "New User Added",
            "A new user has been added to the system.",
            $"/admin/users/{user.Id}"
        );
    }
}
catch { }
```

- [ ] **Step 3: Build**

```bash
cd NAFServer
dotnet build
```

Expected: Build succeeded.

- [ ] **Step 4: Commit**

```bash
git add NAFServer/src/Application/Services/AdminService.cs
git commit -m "feat(notifications): notify on user created"
```

---

## Task 12: Integration — ResourceManagementService

**Files:**
- Modify: `NAFServer/src/Application/Services/ResourceManagementService.cs`

When a resource is created or a workflow template is added, notify all admins. Link: `/admin/resources/{resourceId}`.

- [ ] **Step 1: Inject INotificationService**

Add field:
```csharp
private readonly INotificationService _notificationService;
```

Update constructor:
```csharp
public ResourceManagementService(
    AppDbContext context,
    IEmployeeRepository employeeRepository,
    INotificationService notificationService)  // ← new
{
    _context = context;
    _employeeRepository = employeeRepository;
    _notificationService = notificationService;
}
```

- [ ] **Step 2: Add notification in CreateResourceAsync after `await tx.CommitAsync()`**

In `CreateResourceAsync`, after `await tx.CommitAsync();` inside the `try` block:

```csharp
// Notify all admins about new resource
try
{
    var adminIds = await _notificationService.GetAllAdminsAsync();
    if (adminIds.Count > 0)
    {
        await _notificationService.CreateForUsersAsync(
            adminIds,
            "New Resource Added",
            $"A new resource has been added to the system.",
            $"/admin/resources/{resource.Id}"
        );
    }
}
catch { }
```

- [ ] **Step 3: Add notification in AddWorkflowTemplateAsync after `await tx.CommitAsync()`**

In `AddWorkflowTemplateAsync`, after `await tx.CommitAsync();` inside the `try` block:

```csharp
// Notify all admins about workflow template change
try
{
    var adminIds = await _notificationService.GetAllAdminsAsync();
    if (adminIds.Count > 0)
    {
        await _notificationService.CreateForUsersAsync(
            adminIds,
            "Resource Workflow Updated",
            $"An approval workflow has been updated.",
            $"/admin/resources/{resourceId}"
        );
    }
}
catch { }
```

- [ ] **Step 4: Build**

```bash
cd NAFServer
dotnet build
```

Expected: Build succeeded.

- [ ] **Step 5: Commit**

```bash
git add NAFServer/src/Application/Services/ResourceManagementService.cs
git commit -m "feat(notifications): notify on resource added/workflow updated"
```

---

## Task 13: Frontend — Install Package + types.ts + api.ts

**Files:**
- Install: `@microsoft/signalr`
- Create: `NAFClient/src/features/notifications/types.ts`
- Create: `NAFClient/src/features/notifications/api.ts`

- [ ] **Step 1: Install the SignalR client package**

```bash
cd NAFClient
npm install @microsoft/signalr
```

Expected: Package added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Create types.ts**

```typescript
// NAFClient/src/features/notifications/types.ts
import type { PagedResult } from "@/shared/types/common/pagedResult";

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export type NotificationsResult = PagedResult<NotificationDTO> & {
  unreadCount: number;
};
```

- [ ] **Step 3: Create api.ts**

```typescript
// NAFClient/src/features/notifications/api.ts
import { api } from "@/shared/api/client";
import type { NotificationsResult } from "./types";

export const notificationsApi = {
  getMyNotifications: async (page: number): Promise<NotificationsResult> => {
    const res = await api.get("/notifications/mine", { params: { page } });
    return res.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  },
};
```

- [ ] **Step 4: Build to check for type errors**

```bash
cd NAFClient
npm run build
```

Expected: Build succeeded, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add NAFClient/src/features/notifications/types.ts NAFClient/src/features/notifications/api.ts NAFClient/package.json NAFClient/package-lock.json
git commit -m "feat(notifications): add frontend types, api, and install @microsoft/signalr"
```

---

## Task 14: Frontend — useNotifications Hook

**Files:**
- Create: `NAFClient/src/features/notifications/hooks/useNotifications.ts`

The hook establishes a SignalR connection on mount, tears it down on unmount, and uses React Query for the notification list. New notifications arriving via SignalR are prepended directly into the query cache.

- [ ] **Step 1: Create the hook**

```typescript
// NAFClient/src/features/notifications/hooks/useNotifications.ts
import { useEffect, useRef } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";
import { notificationsApi } from "../api";
import type { NotificationDTO, NotificationsResult } from "../types";

const QUERY_KEY = ["notifications", 1] as const;

const hubUrl = import.meta.env.VITE_API_URL.replace("/api", "") + "/hubs/notifications";

export function useNotifications() {
  const queryClient = useQueryClient();
  const connectionRef = useRef<ReturnType<typeof buildConnection> | null>(null);

  function buildConnection() {
    return new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect()
      .build();
  }

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationsApi.getMyNotifications(1),
    staleTime: 30_000,
  });

  useEffect(() => {
    const connection = buildConnection();
    connectionRef.current = connection;

    connection.on("ReceiveNotification", (notification: NotificationDTO) => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [notification, ...old.data],
          totalCount: old.totalCount + 1,
          unreadCount: old.unreadCount + 1,
        };
      });
    });

    connection
      .start()
      .catch(() => {});

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop();
      }
    };
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onMutate: (id) => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          unreadCount: Math.max(0, old.unreadCount - 1),
        };
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: () => {
      queryClient.setQueryData<NotificationsResult>(QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });
    },
  });

  return {
    notifications: data?.data ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
  };
}
```

- [ ] **Step 2: Build to check for type errors**

```bash
cd NAFClient
npm run build
```

Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/notifications/hooks/useNotifications.ts
git commit -m "feat(notifications): add useNotifications hook with SignalR + React Query"
```

---

## Task 15: Frontend — NotificationBell Component

**Files:**
- Create: `NAFClient/src/features/notifications/components/NotificationBell.tsx`

The bell icon shows an amber badge when there are unread notifications. Clicking it opens a Radix UI `Popover` with the notification list.

- [ ] **Step 1: Create the component**

```tsx
// NAFClient/src/features/notifications/components/NotificationBell.tsx
import { Bell } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { cn } from "@/shared/utils/utils";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={8}
          align="end"
          className="z-50 w-80 max-h-[480px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg outline-none"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 text-center">
              No notifications
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                      navigate(n.link);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50",
                      !n.isRead && "border-l-4 border-l-amber-400 pl-3"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 leading-snug">
                        {n.title}
                      </span>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
```

- [ ] **Step 2: Build to check for type errors**

```bash
cd NAFClient
npm run build
```

Expected: Build succeeded, no errors.

- [ ] **Step 3: Commit**

```bash
git add NAFClient/src/features/notifications/components/NotificationBell.tsx
git commit -m "feat(notifications): add NotificationBell component with Radix Popover"
```

---

## Task 16: Frontend — Header.tsx Integration

**Files:**
- Modify: `NAFClient/src/shared/components/layout/Header.tsx`

`NotificationBell` is added to the right side of the header, visible in all role layouts (Admin, HR, REQUESTOR_APPROVER) because they all use the same `Layout` → `Header` component.

The bell should only render when the user is authenticated. Import `useAuth` to check.

- [ ] **Step 1: Update Header.tsx**

Replace the entire file with:

```tsx
// NAFClient/src/shared/components/layout/Header.tsx
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/images/smpc_logo.png";
import { useAuth } from "@/features/auth/AuthContext";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 bg-white border-b border-gray-200 px-4 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      <img src={Logo} alt="Logo" className="w-24 md:w-32" />

      {/* Push bell to the right */}
      <div className="ml-auto">
        {user && <NotificationBell />}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd NAFClient
npm run build
```

Expected: Build succeeded.

- [ ] **Step 3: Start dev server and manually verify**

Start the backend:
```bash
cd NAFServer
dotnet run
```

Start the frontend:
```bash
cd NAFClient
npm run dev
```

Open `http://localhost:5173`, log in as an ADMIN user.

- Bell icon appears in the top-right of the header.
- Creating a NAF causes a notification to appear in the bell panel (unread badge increments).
- Clicking a notification marks it read (amber border disappears) and navigates to the link.
- "Mark all as read" clears the badge.
- Logging in on a second tab/browser as the same user and creating a NAF should push a real-time notification to the first tab via SignalR.

- [ ] **Step 4: Commit**

```bash
git add NAFClient/src/shared/components/layout/Header.tsx
git commit -m "feat(notifications): integrate NotificationBell into shared Header"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec requirement | Task |
|---|---|
| `Notification` entity with all 7 fields | Task 1 |
| EF Core config: User has collection of Notifications | Task 2 |
| `INotificationRepository` with all 5 methods | Task 3 |
| `NotificationRepository` implements all methods | Task 3 |
| `INotificationService.CreateForUsersAsync` | Task 5 |
| `INotificationService.MarkAsReadAsync` / `MarkAllAsReadAsync` | Task 5 |
| Private helpers: GetAdminsByLocationAsync, FindUserIdByEmployeeNumberAsync | Task 5 (exposed as public for callers) |
| NotificationHub at `/hubs/notifications` | Task 6 |
| Hub joins `user-{userId}` group on connect | Task 6 |
| Hub `[Authorize]` | Task 6 |
| `GET /api/notifications/mine?page=` | Task 7 |
| `PUT /api/notifications/{id}/read` | Task 7 |
| `PUT /api/notifications/read-all` | Task 7 |
| Program.cs: AddSignalR, register, MapHub | Task 8 |
| CORS already configured with AllowCredentials | Existing code — no change needed |
| NAF created → notify admins+supervisor+depthead | Task 9 |
| Request approved → notify requestor+next approver | Task 10 |
| Request rejected → notify requestor | Task 10 |
| User created → notify all admins | Task 11 |
| Resource added/modified → notify all admins | Task 12 |
| Frontend: `@microsoft/signalr` installed | Task 13 |
| `NotificationDTO` frontend type | Task 13 |
| `getMyNotifications`, `markAsRead`, `markAllAsRead` API functions | Task 13 |
| `useNotifications` hook: SignalR connection, ReceiveNotification, unreadCount | Task 14 |
| `withAutomaticReconnect()` | Task 14 |
| `NotificationBell`: bell icon + amber badge + popover | Task 15 |
| Popover: title, message (2 lines), time-ago, unread = amber left border | Task 15 |
| "Mark all as read" button | Task 15 |
| Click navigates to link + marks read | Task 15 |
| Empty state "No notifications" | Task 15 |
| NotificationBell in shared header | Task 16 |

### Key Corrections vs Spec
- Spec says `FindUserIdByEmployeeIdAsync` — actual `User` field is `EmployeeNumber`, so the method is named `FindUserIdByEmployeeNumberAsync` throughout.
- Spec says `NotificationBell` is added to `Layout.tsx` — actual shared layout component is `Header.tsx`. `Layout.tsx` wraps `Header.tsx`.
- Spec says helpers are "private" — exposed as public interface methods so integration call sites can use them without duplicating EF Core queries.
- `GetAllAdminsAsync` added (not in spec) to support "all admins" recipient resolution for resource and user events which are not location-scoped.
