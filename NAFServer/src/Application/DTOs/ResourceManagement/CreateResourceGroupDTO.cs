using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record CreateResourceGroupDTO(
        [Required][MinLength(1)] string Name,
        bool CanOwnMany
    );
}
