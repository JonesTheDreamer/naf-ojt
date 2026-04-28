namespace NAFServer.src.Application.Interfaces
{
    public interface ICurrentUserService
    {
        string EmployeeId { get; }
        string Role { get; }
        bool IsAuthenticated { get; }
        Task<string> GetDepartmentIdAsync();
        Task<int> GetLocationIdAsync();
    }
}
