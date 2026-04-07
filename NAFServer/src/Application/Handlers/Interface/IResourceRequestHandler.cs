using NAFServer.src.Domain.Interface;
using System.Text.Json;

namespace NAFServer.src.Application.Handlers.Interface
{
    public interface IResourceRequestHandler
    {
        public int ResourceId { get; }
        Type AdditionalInfoType { get; }
        Task<bool> Validate(ResourceRequestAdditionalInfo AdditionalInfo, Guid nafId);
        object GetSchema();
        Task<ResourceRequestAdditionalInfo> CreateAdditionalInfo(JsonElement dto);
    }
}
