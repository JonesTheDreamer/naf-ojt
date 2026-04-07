namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ResourceDTO
    (
        int Id,
        string Name,
        string? IconUrl,
        bool IsActive,
        bool IsSpecial,
        string color
    );
}
