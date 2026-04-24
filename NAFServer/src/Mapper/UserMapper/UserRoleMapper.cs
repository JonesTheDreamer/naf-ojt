using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Mapper.UserMapper
{
    public class UserRoleMapper
    {
        public static UserRoleDTO ToDTO(UserRole userRole)
        {
            return new UserRoleDTO
            (
                userRole.Id,
                userRole.RoleId,
                userRole.Role.Name.ToString(),
                userRole.UserId,
                userRole.IsActive,
                userRole.DateAdded,
                userRole.DateRemoved
            );
        }
        public static List<UserRoleDTO> ListToDTO(List<UserRole> userRoles)
        {
            return userRoles.Select(ur => ToDTO(ur)).ToList();
        }
    }
}
