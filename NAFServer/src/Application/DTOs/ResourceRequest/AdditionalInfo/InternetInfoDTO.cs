namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record InternetInfoDTO(
        string Purpose,
        string Resource
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.Internet;
    }

}
