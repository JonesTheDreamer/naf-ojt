using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Mapper
{
    public class DepartmentMapper
    {
        public static DepartmentDTO ToDTO(Department department)
        {
            return new DepartmentDTO(
                department.Id,
                department.Code,
                department.Name,
                department.IsActive,
                department.DepartmentHead?.Id ?? "",
                department.LocationId,
                department.Location?.Name ?? ""
            );
        }
        public static List<DepartmentDTO> ListToDTO(List<Department> departments)
        {
            return departments.Select(d => ToDTO(d)).ToList();
        }
    }
}
