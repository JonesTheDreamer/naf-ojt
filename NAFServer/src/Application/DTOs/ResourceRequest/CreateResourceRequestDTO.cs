using System.Text.Json;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record CreateResourceRequestDTO
    (
        Guid nafId,
        int resourceId,
        string purpose,
        JsonElement? additionalInfo
    );
}
