namespace NAFServer.src.Application.DTOs.NAF
{
    public record IdentifyApproverDTO
    (
        Guid EmployeeId,
        int StepOrder
    );
}
