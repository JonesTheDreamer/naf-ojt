namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record CreateResourceRequestFromAPIDTO
    (
        int resourceId,
        string purpose,
        object? additionalInfo,
        DateTime? dateNeeded = null
    );
}
