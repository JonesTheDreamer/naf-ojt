namespace NAFServer.src.Application.DTOs.Admin
{
    public record AdminResourceRequestDTO(
        Guid Id,
        Guid NafId,
        string NafReference,
        string EmployeeName,
        string ResourceName,
        int Progress,
        DateTime? DateNeeded,
        DateTime CreatedAt
    );
}
