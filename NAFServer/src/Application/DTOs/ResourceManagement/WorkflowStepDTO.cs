namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record WorkflowStepDTO(
        int StepOrder,
        string StepAction,
        string ApproverRole,
        string? ApproverEntity
    );
}
