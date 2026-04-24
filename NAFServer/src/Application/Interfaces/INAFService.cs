using NAFServer.src.Application.DTOs.NAF;
using static NAFServer.src.Application.DTOs.Common.PaginatedDTO;

namespace NAFServer.src.Application.Interfaces
{
    public interface INAFService
    {
        public Task<NAFDTO> GetNAFByIdAsync(Guid id);
        public Task<NAFDTO> CreateAsync(CreateNAFRequestDTO request);
        public Task<PagedResult<NAFDTO>> GetNAFsUnderEmployeeAsync(string employeeId, int page);
        public Task<NAFDTO> DeactivateNAFAsync(Guid nafId);
        public Task<NAFDTO> ActivateNAFAsync(Guid nafId);
        public Task<PagedResult<NAFDTO>> GetNAFToApproveAsync(string employeeId, int page);
        public Task<bool> EmployeeHasNAFForDepartmentAsync(string employeeId, int departmentId);
        public Task<List<NAFDTO>> GetNAFByEmployeeIdAsync(string employeeId);
        public Task<List<NAFDTO>> GetNAFByLocationAsync(int locationId);
        Task<List<AddBasicResourceResultDTO>> AddBasicResourcesToNAFAsync(Guid nafId, List<BasicResourceWithDateDTO> resources);
    }
}
