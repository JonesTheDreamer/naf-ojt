namespace NAFServer.src.Application.DTOs.ApprovalWorkflow
{
    public record CascadingApprovalWorkflowDTO
    (
        Guid ResourceId,
        bool ResourceCompleted,
        Guid NafId,
        bool NafCompleted
    );
}
