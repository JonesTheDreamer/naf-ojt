namespace NAFServer.src.Application.DTOs.Admin
{
    public record DashboardStatsDTO(
        Dictionary<string, List<AdminResourceRequestDTO>> RecentByStatus,
        int BeyondDeadlineCount,
        List<ResourceAccessCountDTO> ResourceAccessCounts
    );
}
