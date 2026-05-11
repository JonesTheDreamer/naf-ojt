namespace NAFServer.src.Application.DTOs.HR
{
    public record HRNafDTO(
        Guid NafId,
        string EmployeeName,
        string Department,
        DateTime DateCreated
    );
}
