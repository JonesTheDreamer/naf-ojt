namespace NAFServer.src.Application.DTOs.Lookup
{
    public record CreateInternetResourceDTO(string Name, string Url, string? Description, int PurposeId);
}
