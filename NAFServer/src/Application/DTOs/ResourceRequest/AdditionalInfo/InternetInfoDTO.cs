namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record InternetInfoDTO(
        int InternetResourceId,
        string Purpose,
        string Resource,
        string url
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.Internet;
    }
}
