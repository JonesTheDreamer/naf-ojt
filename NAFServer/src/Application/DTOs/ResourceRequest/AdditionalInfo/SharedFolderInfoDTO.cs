namespace NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo
{
    public record SharedFolderInfoDTO(
        int SharedFolderId,
        string Name,
        string DepartmentId,
        string Remarks
    ) : AdditionalInfoDTO
    {
        public override AdditionalInfoType Type => AdditionalInfoType.SharedFolder;
    }
}