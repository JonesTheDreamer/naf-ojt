namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record WorkflowTemplateVersionDTO(
        Guid Id,
        int Version,
        bool IsActive,
        List<WorkflowStepDTO> Steps
    );
}
