namespace NAFServer.src.Application.DTOs.Admin
{
    public record SharedFolderAccessEntryDTO(
        string EmployeeName,
        string Position,
        string Progress,
        DateTime DateRequested
    );
}
