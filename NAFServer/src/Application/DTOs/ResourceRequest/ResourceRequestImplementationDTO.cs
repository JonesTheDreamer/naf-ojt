using static NAFServer.src.Domain.Entities.ResourceRequestImplementation;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ResourceRequestImplementationDTO
    (
        Guid Id,
        Guid ResourceRequestId,
        DateTime? AcceptedAt,
        DateTime? AccomplishedAt,
        string? EmployeeId,
        ImplementationStatus Status,
        string? DelayReason,
        DateTime? DelayedAt,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );
}
