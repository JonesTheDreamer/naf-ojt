using NAFServer.src.Application.DTOs.ResourceRequestAllowance;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Mapper
{
    public static class ResourceRequestAllowanceMapper
    {
        public static ResourceRequestAllowanceDTO ToDTO(ResourceRequestAllowance allowance) =>
            new(
                allowance.Id,
                allowance.ResourceId,
                allowance.Resource?.Name ?? string.Empty,
                allowance.LocationId,
                allowance.Location?.Name ?? string.Empty,
                allowance.AllowanceDays
            );

        public static List<ResourceRequestAllowanceDTO> ListToDTO(List<ResourceRequestAllowance> list) =>
            list.Select(ToDTO).ToList();
    }
}
