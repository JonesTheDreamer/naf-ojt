using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.DTOs.User
{
    public record UserDTO
    (
        int Id,
        string EmployeeId,
        string LastName,
        string FirstName,
        string? MiddleName,
        string Company,
        string Position,
        int DepartmentId,
        string Department,
        int LocationId,
        string Location,
        List<Roles> Roles
    );
}
