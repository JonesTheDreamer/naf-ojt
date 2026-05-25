namespace NAFServer.src.Application.DTOs.ResourceRequestAllowance
{
    public record CreateResourceRequestAllowanceDTO(
        int ResourceId,
        int LocationId,
        int AllowanceDays
    );
}
