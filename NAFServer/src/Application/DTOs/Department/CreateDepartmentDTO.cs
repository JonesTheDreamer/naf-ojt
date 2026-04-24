namespace NAFServer.src.Application.DTOs.Department
{
    public record CreateDepartmentDTO
    (
        string Code,
        string Name,
        string DepartmentHeadId,
        int LocationId
    );
}
