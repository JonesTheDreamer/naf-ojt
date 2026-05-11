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
