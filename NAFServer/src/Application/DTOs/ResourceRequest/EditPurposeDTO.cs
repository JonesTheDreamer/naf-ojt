namespace NAFServer.src.Application.DTOs.ResourceRequest
{
    public record EditPurposeDTO
    (
        //Guid requestId,
        string purpose,
        Guid resourceRequestApprovalStepHistoryId
    );
}
