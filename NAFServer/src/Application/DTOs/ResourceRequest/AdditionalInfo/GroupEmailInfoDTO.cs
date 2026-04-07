namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record GroupEmailInfoDTO(
        string Email
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.GroupEmail;
    }
}
