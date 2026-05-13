namespace NAFServer.src.Application.DTOs.Department
{
    public record DepartmentDetailDTO(
        int Id,
        string Code,
        string Name,
        bool IsActive,
        string DepartmentHeadId,
        string DepartmentHeadName,
        string DepartmentHeadPosition,
        int LocationId,
        string Location
    );
}
