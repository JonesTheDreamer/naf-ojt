using NAFServer.src.Application.DTOs.Admin;

namespace NAFServer.src.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardStatsDTO> GetStatsAsync(int? locationId);
        Task<DashboardAverageTimeDTO> GetAverageTimeAsync(int? locationId);
    }
}
