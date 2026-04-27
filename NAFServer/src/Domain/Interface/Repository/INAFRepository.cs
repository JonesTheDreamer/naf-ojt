using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Domain.Entities;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;
namespace NAFServer.src.Domain.Interface.Repository
{
    public interface INAFRepository
    {
        public Task<NAF> GetByIdAsync(Guid nafId);
        public Task<List<NAFDTO>> GetByEmployeeIdAsync(string employeeId);
        public Task<PagedResult<NAFDTO>> GetNAFUnderEmployee(
            string employeeId,
            int page = 1
            );
        public Task<PagedResult<NAFDTO>> GetNAFToApprove(
            string employeeId,
            int page = 1
            );
        //public Task<PagedResult<NAFDTO>> GetNAFPerLocation(
        //    string employeeId,
        //    int page = 1
        //    );
        public Task<bool> EmployeeHasNAFForDepartmentAsync(string employeeId, int departmentId);
        public Task<PagedResult<NAFDTO>> GetNAFsByLocationPagedAsync(int locationId, string status, int page);
    }
}
