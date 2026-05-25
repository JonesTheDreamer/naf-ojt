namespace NAFServer.src.Application.DTOs.Admin
{
    public record DashboardAverageTimeDTO(
        int SampleCount,
        double? OverallAvgMinutes,
        double? OpenToApprovalAvgMinutes,
        double? ApprovalToScreeningAvgMinutes,
        double? ScreeningToImplementationAvgMinutes,
        double? ImplementationToAccomplishedAvgMinutes
    );
}
