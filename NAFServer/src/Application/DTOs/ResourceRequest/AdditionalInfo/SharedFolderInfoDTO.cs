namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record SharedFolderInfoDTO(
        string Name,
        string DepartmentId
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.SharedFolder;
    }
}