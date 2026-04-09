using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.Interfaces
{
    public interface IImplementationService
    {
        Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string employeeId);
        Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string delayReason);
        Task<ResourceRequestImplementationDTO> SetToAccomplished(string request);
        Task<List<ForImplementationItemDTO>> GetMyTasksAsync(string employeeId);
        Task<List<ForImplementationItemDTO>> GetForImplementationsAsync();
        Task<ForImplementationItemDTO> AssignToMeAsync(Guid resourceRequestId, string employeeId);
    }
}
