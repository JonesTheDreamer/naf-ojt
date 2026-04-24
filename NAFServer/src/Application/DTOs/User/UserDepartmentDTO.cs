namespace NAFServer.src.Application.DTOs.User
{
    public record UserDepartmentDTO
    (
        int Id,
        int DepartmentId,
        string DepartmentName,
        int UserId,
        bool IsDepartmentActive,
        bool IsActive,
        DateTime DateAdded,
        DateTime? DateRemoved
    );
}
