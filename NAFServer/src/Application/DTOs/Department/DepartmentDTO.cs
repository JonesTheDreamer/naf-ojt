namespace NAFServer.src.Application.DTOs.Department
{
    public record DepartmentDTO
    (
        int Id,
        string Code,
        string Name,
        bool IsActive,
        string DepartmentHeadId,
        int LocationId,
        string Location
    );
}
