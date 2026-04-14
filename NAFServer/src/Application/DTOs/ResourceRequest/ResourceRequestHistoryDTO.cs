using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ResourceRequestHistoryDTO
    (
        Guid Id,
        Guid ResourceRequestId,
        ResourceRequestAction type,
        string description,
        DateTime CreatedAt
    );
}
