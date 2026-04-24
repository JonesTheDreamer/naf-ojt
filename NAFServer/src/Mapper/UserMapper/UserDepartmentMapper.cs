using NAFServer.src.Application.DTOs.User;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Mapper.UserMapper
{
    public class UserDepartmentMapper
    {
        public static UserDepartmentDTO ToDTO(UserDepartment userDepartment)
        {
            return new UserDepartmentDTO
            (
                userDepartment.Id,
                userDepartment.DepartmentId,
                userDepartment.Department.Name,
                userDepartment.UserId,
                userDepartment.Department.IsActive,
                userDepartment.IsActive,
                userDepartment.DateAdded,
                userDepartment.DateRemoved
            );
        }
        public static List<UserDepartmentDTO> ListToDTO(List<UserDepartment> userDepartments)
        {
            return userDepartments.Select(ud => ToDTO(ud)).ToList();
        }
    }
}
