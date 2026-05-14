namespace NAFServer.src.Application.DTOs.Admin
{
    public record AdminForScreeningItemDTO(
        Guid ResourceRequestId,
        Guid NafId,
        string NafReference,
        string EmployeeName,
        string ResourceName,
        DateTime? DateNeeded,
        Guid CurrentStepId,
        string? StepClaimedBy
    );
}
