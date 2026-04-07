using NAFServer.src.Application.DTOs.ResourceRequest;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface IResourceRequestService
    {
        public Task<ResourceRequestDTO> CreateSpecialAsync(CreateResourceRequestDTO request);
        public Task<ResourceRequestDTO> CreateBasicAsync(CreateResourceRequestDTO request);
        public Task<ResourceRequestDTO> GetByIdAsync(Guid id);
        public Task<List<ResourceRequestApprovalStep>> FetchApproversAsync(ResourceRequest request);
        public Task<ResourceRequestDTO> EditPurposeAsync(Guid requestId, EditPurposeDTO request);
        public Task DeleteAsync(Guid id);
    }
}
