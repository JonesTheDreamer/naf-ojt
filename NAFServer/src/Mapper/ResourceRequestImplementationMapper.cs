using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Mapper
{
    public class ResourceRequestImplementationMapper
    {
        public static ResourceRequestImplementationDTO ToDTO(ResourceRequestImplementation implementation)
        {
            return new ResourceRequestImplementationDTO
            (
                implementation.Id,
                implementation.ResourceRequestId,
                implementation.AcceptedAt,
                implementation.AccomplishedAt,
                implementation.EmployeeId,
                implementation.Status,
                implementation.DelayReason,
                implementation.DelayedAt,
                implementation.CreatedAt,
                implementation.UpdatedAt
            );
        }
    }
}
