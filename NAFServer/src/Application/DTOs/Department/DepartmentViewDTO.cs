namespace NAFServer.src.Application.DTOs.Department
{
    public record DepartmentViewDTO(
        string Id,
        string? DepartmentDesc,
        string? DepartmentHead
    );
}
