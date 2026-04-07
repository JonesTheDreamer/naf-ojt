namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ResourceRequestPurposeDTO
    (
        Guid Id,
        string Purpose,
        Guid ResourceRequestId,
        Guid? ResourceRequestApprovalStepHistoryId,
        DateTime CreatedAt
    );
}