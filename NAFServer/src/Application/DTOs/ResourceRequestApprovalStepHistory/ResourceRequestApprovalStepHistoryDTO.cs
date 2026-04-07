using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.DTOs.ResourceRequestApprovalStepHistory
{
    public record ResourceRequestApprovalStepHistoryDTO
    (
        Guid Id,
        Status Status,
        string? Comment,
        string? ReasonForRejection,
        DateTime ActionAt,
        Guid ResourceRequestApprovalStepId
    );
}
