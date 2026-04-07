using NAFServer.src.Application.DTOs.ResourceRequestApprovalStep;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ResourceRequestDTO
    (
        Guid Id,
        int CurrentStep,
        Progress Progress,
        DateTime AccomplishedAt,
        Guid NAFId,
        Guid ApprovalWorkflowTemplateId,
        ResourceDTO Resource,
        object? AdditionalInfo,
        List<ResourceRequestPurposeDTO> Purposes,
        List<ResourceRequestApprovalStepDTO> Steps,
        ResourceRequestImplementationDTO? Implementation
    );
}