namespace NAFServer.src.Application.DTOs.NAF
{
    public record CreateNAFRequestDTO
    (
        string EmployeeId,
        string RequestorId,
        int HardwareId,
        DateTime DateNeeded
    );
}
