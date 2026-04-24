namespace NAFServer.src.Application.DTOs.User
{
    public record UserRoleDTO
    (
        int Id,
        int RoleId,
        string Role,
        int UserId,
        bool IsActive,
        DateTime DateAdded,
        DateTime? DateRemoved
    );
}
