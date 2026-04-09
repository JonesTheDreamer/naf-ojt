namespace NAFServer.src.Application.Interfaces
{
    public interface ICurrentUserService
    {
        string EmployeeId { get; }
        bool IsAuthenticated { get; }
    }
}
