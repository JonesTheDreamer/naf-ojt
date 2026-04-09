namespace NAFServer.src.Application.DTOs.Admin
{
    public record UserWithRolesDTO(string EmployeeId, string Location, List<UserRoleDTO> Roles);
}
