using NAFServer.src.Application.DTOs.ResourceRequestApprovalStep;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ResourceRequestDTO
    (
        Guid Id,
        int CurrentStep,
        Progress Progress,
        bool IsActive,
        DateTime AccomplishedAt,
        DateTime? CancelledAt,
        DateTime? DateNeeded,
        Guid NAFId,
        Guid? ApprovalWorkflowTemplateId,
        ResourceDTO Resource,
        object? AdditionalInfo,
        List<ResourceRequestHistoryDTO> Histories,
        List<ResourceRequestPurposeDTO> Purposes,
        List<ResourceRequestApprovalStepDTO> Steps,
        ResourceRequestImplementationDTO? Implementation,
        DateTime CreatedAt
    );
}