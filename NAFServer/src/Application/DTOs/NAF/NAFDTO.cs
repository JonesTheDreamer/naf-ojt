using NAFServer.src.Application.DTOs.Employee;
using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Domain.Enums;

namespace NAFServer.src.Application.DTOs.NAF
{
    public record NAFDTO
    (
        Guid Id,
        string Reference,
        string RequestorId,
        EmployeeDTO Employee,
        DateTime? AccomplishedAt,
        DateTime SubmittedAt,
        Progress Progress,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        string DepartmentId,
        List<ResourceRequestDTO> ResourceRequests
    );
}
