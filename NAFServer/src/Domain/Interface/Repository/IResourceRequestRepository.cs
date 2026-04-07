using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IResourceRequestRepository
    {
        public Task<ResourceRequest> GetByIdAsync(Guid id);
        public Task<ResourceRequest> GetByApprovalStepId(Guid id);
        public Task<bool> ResourceRequestExistsAsync<TAdditionalInfo>
        (
             Guid nafId,
             int resourceId,
             Func<TAdditionalInfo, int> resourceSelector
        ) where TAdditionalInfo : ResourceRequestAdditionalInfo;
        //public Task<bool> ResourceRequestExistsAsync<TAdditionalInfo>(Guid employeeId, int resourceId)
    }
}
