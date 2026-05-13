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
                new NotificationDTO(n.Id, n.Title, n.Message, n.Link, n.Entity, n.IsRead, n.CreatedAt)
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
