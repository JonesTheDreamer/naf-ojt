# Notification System Design

## Goal

Add a real-time in-app notification system using SignalR. Users receive notifications when relevant events occur (NAF created, request approved/rejected, user added, resource changed). A bell icon in all layouts shows an unread badge and opens a notification panel.

## Architecture

A `Notification` table stores all records. `NotificationService` creates records and pushes them to connected clients via a SignalR hub. Existing service methods call `NotificationService` after their core logic. The frontend holds a persistent SignalR connection per authenticated session, updates the badge in real-time, and loads the full list on demand via REST.

## Backend

### New Entity

**`Notification`** at `NAFServer/src/Domain/Entities/Notification.cs`:
- `Guid Id`
- `int UserId` — FK to `User`
- `string Title`
- `string Message`
- `string Link` — frontend route to navigate to on click
- `bool IsRead` (default false)
- `DateTime CreatedAt`

EF Core config: `User` has `ICollection<Notification> Notifications`.

### New Repository

**`INotificationRepository`** / **`NotificationRepository`**:
- `CreateAsync(Notification)`
- `GetByUserIdAsync(int userId, int page, int pageSize)` — unread first, then by `CreatedAt` desc
- `GetUnreadCountAsync(int userId)`
- `MarkAsReadAsync(Guid id, int userId)`
- `MarkAllAsReadAsync(int userId)`

### New Service

**`INotificationService`** / **`NotificationService`**:
- `CreateForUsersAsync(List<int> userIds, string title, string message, string link)` — saves a `Notification` per userId, then pushes each via SignalR to that user's personal group
- `MarkAsReadAsync(Guid id, int userId)`
- `MarkAllAsReadAsync(int userId)`

**Recipient resolution** (private helpers on `NotificationService`):
- `GetAdminsByLocationAsync(int locationId)` — queries `UserLocations` + `UserRoles` for ADMIN role at that location, returns `List<int>` userIds
- `FindUserIdByEmployeeIdAsync(string employeeId)` — looks up `User` by `EmployeeId`, returns `int?`, null if not found (silently skipped)

### SignalR Hub

**`NotificationHub`** at `NAFServer/src/API/Hubs/NotificationHub.cs`:
- Route: `/hubs/notifications`
- On `OnConnectedAsync`: client joins group named `$"user-{userId}"` where `userId` is read from JWT claim
- `[Authorize]` — no unauthenticated connections
- `NotificationService.CreateForUsersAsync` calls `_hubContext.Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", dto)` for each recipient

### New Controller

**`NotificationsController`** at `NAFServer/src/API/Controllers/NotificationsController.cs`:
- `[Authorize]`
- `GET /api/notifications/mine?page=` — returns `PagedResult<NotificationDTO>` (unread first)
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/read-all`

### New DTO

**`NotificationDTO`**:
- `Guid Id`, `string Title`, `string Message`, `string Link`, `bool IsRead`, `DateTime CreatedAt`

### Integration Points

| Event | Triggered in | Recipients | Link |
|---|---|---|---|
| NAF created | `NAFService.CreateNAFAsync` | All admins at NAF's locationId + supervisor (if user) + dept head (if user) | `/admin/NAF/{nafId}` |
| Request approved | `ResourceRequestApprovalStepService.ApproveStepAsync` | Requestor + next approver (if user) | `/NAF/{nafId}` for requestor, `/admin/NAF/{nafId}` for approver |
| Request rejected | `ResourceRequestApprovalStepService.RejectStepAsync` | Requestor | `/NAF/{nafId}` |
| User created | `AdminService.CreateUserAsync` | All admins | `/admin/users/{userId}` |
| Resource added/modified | `ResourceManagementService` | All admins | `/admin/resources/{resourceId}` |

### Program.cs additions
```csharp
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
// ...
app.MapHub<NotificationHub>("/hubs/notifications");
```

CORS must allow credentials and the frontend origin (already configured).

## Frontend

### New files

```
src/features/notifications/
  types.ts                              — NotificationDTO interface
  api.ts                                — getMyNotifications, markAsRead, markAllAsRead
  hooks/useNotifications.ts             — SignalR connection + React Query list
  components/NotificationBell.tsx       — bell icon + badge + popover panel
```

### NotificationDTO (frontend)
```ts
interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}
```

### useNotifications hook
- Establishes SignalR connection to `/hubs/notifications` (with credentials — cookie auth)
- On `ReceiveNotification`: prepends new notification to list, increments unread count
- On mount: calls `getMyNotifications(1)` to load initial list
- Exposes: `notifications`, `unreadCount`, `markAsRead(id)`, `markAllAsRead()`, `isLoading`
- Reconnects automatically on disconnect (SignalR `withAutomaticReconnect()`)

### NotificationBell component
- Bell icon (lucide `Bell`) with amber badge showing `unreadCount` (hidden when 0)
- Clicking opens a `Popover` (ShadCN) listing notifications
- Each notification item: title (bold), message (truncated to 2 lines), time-ago, unread = amber left border
- Clicking a notification: calls `markAsRead(id)`, navigates to `notification.link`
- "Mark all as read" button at panel top
- Empty state: "No notifications"

### Layout integration
`NotificationBell` is added to the header area of `Layout.tsx` (shared), so it appears in Admin, HR, and Requestor/Approver views automatically.

## What Is Not Built

- Email notifications (deferred)
- Notification preferences / opt-out
- Notification deletion
- Push notifications (mobile/browser)
