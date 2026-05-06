using NAFServer.src.Application.DTOs.NAF;
using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.Interfaces
{
    public interface IImplementationService
    {
        Task<ResourceRequestImplementationDTO> CreateImplementationAsync(Guid request);
        Task<ResourceRequestImplementationDTO> SetToInProgress(Guid request, string employeeId);
        Task<ResourceRequestImplementationDTO> SetToDelayed(Guid request, string delayReason);
        Task<ResourceRequestImplementationDTO> SetToAccomplished(Guid request);
        Task<List<NAFDTO>> GetMyTasksAsync(string employeeId);
        Task<List<NAFDTO>> GetForImplementationsAsync(int locationId);
        Task<ForImplementationItemDTO> AssignToMeAsync(Guid request, string employeeId);
    }
}
