namespace NAFServer.src.Application.DTOs.Admin
{
    public record SharedFolderDetailDTO(
        int Id,
        string Name,
        string? OwnerName,
        string? OwnerId,
        bool IsActive,
        PagedAccessList AccessList
    );

    public record PagedAccessList(
        IEnumerable<SharedFolderAccessEntryDTO> Data,
        int TotalCount,
        int PageSize,
        int CurrentPage,
        int TotalPages
    );
}
