using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record CreateWorkflowStepDTO(
        [Range(1, int.MaxValue)] int StepOrder,
        [Required] string StepAction,
        [Required] string ApproverRole,
        [Required] string ApproverEntity
    );
}
