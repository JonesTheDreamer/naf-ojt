using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record CreateResourceRequestDTO(
        Guid nafId,
        [Range(1, int.MaxValue)] int resourceId,
        [Required][MinLength(1)] string purpose,
        JsonElement? additionalInfo,
        DateTime dateNeeded
    );
}
