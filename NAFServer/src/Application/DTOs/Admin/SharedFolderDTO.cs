namespace NAFServer.src.Application.DTOs.Admin
{
    public record SharedFolderDTO(
        int Id,
        string Name,
        string? OwnerName,
        string? OwnerId,
        bool IsActive
    );
}
