namespace NAFServer.src.Application.DTOs.Employee
{
    public record EmployeeDTO
    (
        string Id,
        string FirstName,
        string? MiddleName,
        string LastName,
        string Status,
        string? Company,
        string? HiredDate,
        string? RegularizedDate,
        string? SeparatedDate,
        string? Position,
        string? Location,
        string? SupervisorId,
        string? DepartmentHeadId,
        string DepartmentId,
        string DepartmentDesc
    );
}
