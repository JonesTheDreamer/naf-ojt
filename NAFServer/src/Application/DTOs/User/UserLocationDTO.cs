namespace NAFServer.src.Application.DTOs.User
{
    public record UserLocationDTO
    (
        int Id,
        int LocationId,
        string Location,
        int UserId,
        bool IsLocationActive,
        bool IsActive,
        DateTime DateAdded,
        DateTime? DateRemoved
    );
}
