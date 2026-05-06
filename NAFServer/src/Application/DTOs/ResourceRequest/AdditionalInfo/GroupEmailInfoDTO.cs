namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record GroupEmailInfoDTO(
        int GroupEmailId,
        string Email
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.GroupEmail;
    }
}
