using NAFServer.src.Application.DTOs.Department;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Mapper;

namespace NAFServer.src.Application.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _departmentRepository;
        public DepartmentService(IDepartmentRepository departmentRepository)
        {
            _departmentRepository = departmentRepository;
        }
        public Task<DepartmentDTO> CreateDepartmentAsync(CreateDepartmentDTO req)
        {
            throw new NotImplementedException();
        }

        public async Task<List<DepartmentDTO>> GetAllDepartmentsAsync()
        {
            return DepartmentMapper.ListToDTO(await _departmentRepository.GetAllAsync());
        }

        public async Task<DepartmentDTO> GetDepartmentByCodeAsync(string code)
        {
            return DepartmentMapper.ToDTO(await _departmentRepository.GetByCodeAsync(code));
        }

        public async Task<DepartmentDTO> GetDepartmentByIdAsync(int departmentId)
        {
            return DepartmentMapper.ToDTO(await _departmentRepository.GetByIdAsync(departmentId));
        }

        public async Task RemoveDepartment(string code)
        {
            await _departmentRepository.RemoveAsync(code);
        }

        public async Task<DepartmentDTO> SetDepartmentHeadAsync(string code, string employeeNumber)
        {
            return DepartmentMapper.ToDTO(await _departmentRepository.SetDepartmentHeadAsync(code, employeeNumber));
        }

        public async Task<DepartmentDTO> SetLocationAsync(string code, int locationId)
        {
            return DepartmentMapper.ToDTO(await _departmentRepository.SetLocationAsync(code, locationId));
        }
    }
}
