using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record CreateResourceDTO(
        [Required][MinLength(1)] string Name,
        [Required] string Color,
        bool IsSpecial,
        int? ResourceGroupId,
        List<CreateWorkflowStepDTO>? Steps
    );
}
