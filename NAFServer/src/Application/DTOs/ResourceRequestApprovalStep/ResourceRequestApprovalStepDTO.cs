using NAFServer.src.Application.DTOs.ResourceRequestApprovalStepHistory;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.DTOs.ResourceRequestApprovalStep
{
    public record ResourceRequestApprovalStepDTO
    (
        Guid Id,
        Guid ResourceRequestId,
        int StepOrder,
        StepAction StepAction,
        string ApproverId,
        string? ApproverName,
        Progress Progress,
        DateTime? ApprovedAt,
        List<ResourceRequestApprovalStepHistoryDTO> Histories
    );
}
