namespace NAFServer.src.Application.DTOs.ResourceRequestAllowance
{
    public record ResourceRequestAllowanceDTO(
        int Id,
        int ResourceId,
        string ResourceName,
        int LocationId,
        string LocationName,
        int AllowanceDays
    );
}
