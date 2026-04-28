using System.ComponentModel.DataAnnotations;

namespace NAFServer.src.Application.DTOs.Auth
{
    public record LoginRequestDTO([Required][MinLength(1)] string EmployeeId);
}
