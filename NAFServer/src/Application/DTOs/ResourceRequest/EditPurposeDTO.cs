using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record EditPurposeDTO(
        [Required][MinLength(1)] string purpose
    );
}
