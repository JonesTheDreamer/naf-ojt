namespace NAFServer.src.Application.DTOs.Department
{
    public record DepartmentEmployeeDTO(
        string EmployeeId,
        string FirstName,
        string? MiddleName,
        string LastName,
        string Position,
        Guid? NafId,
        string? NafReference,
        string? NafProgress
    );
}
