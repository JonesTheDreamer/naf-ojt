namespace NAFServer.src.Application.DTOs.Admin
{
    public record ForSocReviewItemDTO(
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
