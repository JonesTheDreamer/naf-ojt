namespace NAFServer.src.Application.DTOs.Admin
{
    public record UserWithRolesDTO(string EmployeeId, int LocationId, List<UserRoleDTO> Roles);
}
