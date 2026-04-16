using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.DTOs.ResourceGroup
{
    public record ResourceGroupDTO(
        int Id,
        string Name,
        bool CanOwnMany,
        bool CanChangeWithoutApproval,
        List<ResourceDTO> Resources
    );
}
