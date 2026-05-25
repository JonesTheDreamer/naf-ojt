namespace NAFServer.src.Application.DTOs.Employee
{
    public record EmployeeDTO(
        string Id,
        string FirstName,
        string? MiddleName,
        string LastName,
        string FullName,
        string Status,
        string? Company,
        string? Position,
        string? Location,
        string? SupervisorId,
        string DepartmentId,
        string DepartmentDesc,
        string DepartmentHead
    );
}
