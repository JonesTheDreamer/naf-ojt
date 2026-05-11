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
