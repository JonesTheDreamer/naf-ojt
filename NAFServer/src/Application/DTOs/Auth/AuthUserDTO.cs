namespace NAFServer.src.Application.DTOs.Auth
{
    public record AuthUserDTO(
        string EmployeeId,
        string ActiveRole,
        string[] Roles,
        string Name,
        int LocationId,
        string Location
    );
}
