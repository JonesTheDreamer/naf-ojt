namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record EmployeeResourceRequestItemDTO(
        string EmployeeId,
        string EmployeeName,
        Guid NAFId,
        Guid ResourceRequestId,
        string Progress
    );
}
