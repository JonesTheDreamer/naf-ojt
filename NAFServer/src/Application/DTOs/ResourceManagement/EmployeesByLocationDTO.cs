namespace NAFServer.src.Application.DTOs.ResourceManagement
{
    public record EmployeesByLocationDTO(
        int LocationId,
        string LocationName,
        List<EmployeeResourceRequestItemDTO> Employees
    );
}
