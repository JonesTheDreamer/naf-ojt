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

        public async Task CreateForUsersAsync(List<int> userIds, string title, string message, string link, string entity)
        {
            foreach (var userId in userIds.Distinct())
            {
                var notification = new Notification(userId, title, message, link, entity);
                await _notificationRepository.CreateAsync(notification);

                var dto = new NotificationDTO(notification.Id, title, message, link, entity, false, notification.CreatedAt);
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
