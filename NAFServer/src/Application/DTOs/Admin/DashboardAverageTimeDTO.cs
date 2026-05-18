namespace NAFServer.src.Application.DTOs.Admin
{
    public record DashboardAverageTimeDTO(
        int SampleCount,
        double? OverallAvgDays,
        double? OpenToApprovalAvgDays,
        double? ApprovalToScreeningAvgDays,
        double? ScreeningToImplementationAvgDays,
        double? ImplementationToAccomplishedAvgDays
    );
}
