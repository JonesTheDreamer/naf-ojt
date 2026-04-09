using static NAFServer.src.Domain.Entities.ResourceRequestImplementation;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ForImplementationItemDTO(
        Guid Id,
        Guid NAFId,
        string Progress,
        string ResourceName,
        Guid? ImplementationId,
        ImplementationStatus? ImplementationStatus,
        string? AssignedTo
    );
}
