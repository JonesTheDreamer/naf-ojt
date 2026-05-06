namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record SharedFolderInfoDTO(
        int SharedFolderId,
        string Name
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.SharedFolder;
    }
}