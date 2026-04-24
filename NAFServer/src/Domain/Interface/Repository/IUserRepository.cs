using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IUserRepository
    {
        Task<List<User>> GetAllAsync();
        Task<List<User>> GetAllUsersInLocationAsync(int locationId);
        Task<User> AddAsync(User user);
        Task<User> GetNetworkAdminOfLocation(int locationId);
        Task<User> GetUserByEmployeeId(string employeeId);
        Task<User> GetUserById(int userId);
        Task<User> ResolveUserByEmployeeId(string employeeId);
    }
}
