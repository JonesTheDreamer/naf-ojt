namespace NAFServer.src.Application.DTOs.ResourceRequestApprovalStep
{
    public record EmployeeApproverDTO(
        string Name,
        string Location,
        string? Department
    );
}
