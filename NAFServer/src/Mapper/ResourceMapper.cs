using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Mapper
{
    public class ResourceMapper
    {
        public static ResourceDTO ToDTO(Resource resource)
        {
            return new ResourceDTO(
                    resource.Id,
                    resource.Name,
                    resource.IconUrl,
                    resource.IsActive,
                    resource.IsSpecial,
                    resource.Color,
                    resource.ResourceGroupId,
                    resource.IsActiveInGroup
            );
        }
    }
}
