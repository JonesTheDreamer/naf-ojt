namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public abstract record AdditionalInfoDTO
    {
        public abstract AdditionalInfoType Type { get; }
    }
}
