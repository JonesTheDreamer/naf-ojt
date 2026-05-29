using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record ChangeResourceDTO(
        [Range(1, int.MaxValue)] int ResourceId,
        string? Purpose,
        DateTime? DateNeeded
    );
}
