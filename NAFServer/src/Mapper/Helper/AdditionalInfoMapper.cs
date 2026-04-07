using NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface;

namespace NAFServer.src.Mapper.Helper
{
    public class AdditionalInfoMapper
    {
        public static AdditionalInfoDTO MapAdditionalInfo(ResourceRequestAdditionalInfo info)
        {
            return info switch
            {
                InternetRequestInfo internet =>
                    new InternetInfoDTO(
                        internet.InternetResource.Purpose.Name,
                        internet.InternetResource.Name
                    ),

                SharedFolderRequestInfo folder =>
                    new SharedFolderInfoDTO(
                        folder.SharedFolder.Name,
                        folder.SharedFolder.DepartmentId
                    ),

                GroupEmailRequestInfo email =>
                    new GroupEmailInfoDTO(
                        email.GroupEmail.Email
                    ),

                _ => throw new Exception("Unknown AdditionalInfo type")
            };
        }
    }
}
