using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.DTOs.NAF
{
    public record AddBasicResourceResultDTO(
        int ResourceId,
        bool Success,
        string? Error,
        ResourceRequestDTO? Data
    );
}
