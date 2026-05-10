using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.Auth
{
    public record SelectRoleRequestDTO([Required][MinLength(1)] string Role);
}
