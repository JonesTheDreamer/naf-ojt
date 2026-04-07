using NAFServer.src.Application.DTOs.ResourceRequest;

namespace NAFServer.src.Application.Interfaces
{
    public interface IImplementationService
    {
        public Task<ResourceRequestImplementationDTO> SetToInProgress(string request, string employeeId);
        public Task<ResourceRequestImplementationDTO> SetToDelayed(string request, string DelayReason);
        public Task<ResourceRequestImplementationDTO> SetToAccomplished(string request);
    }
}
