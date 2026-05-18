namespace NAFServer.src.Application.DTOs.Admin
{
    public record ResourceAccessCountDTO(
        int ResourceId,
        string ResourceName,
        int Count
    );
}
