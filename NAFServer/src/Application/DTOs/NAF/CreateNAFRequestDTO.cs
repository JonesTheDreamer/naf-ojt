namespace NAFServer.src.Application.DTOs.NAF
{
    public record CreateNAFRequestDTO
    (
        string EmployeeId,
        string RequestorId,
        List<int> resourceIds
    //PhysicalMachine machine
    );
}
