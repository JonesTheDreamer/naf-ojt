using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record AddWorkflowTemplateDTO(
        [Required][MinLength(1)] List<CreateWorkflowStepDTO> Steps
    );
}
