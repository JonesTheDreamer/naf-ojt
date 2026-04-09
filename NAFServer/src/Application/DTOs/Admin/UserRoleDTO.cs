namespace NAFServer.src.Application.DTOs.Admin
{
    public record UserRoleDTO(int Id, string EmployeeId, string Role, DateTime DateAdded, DateTime? DateRemoved);
}
