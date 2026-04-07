using NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using System.Text.Json;

namespace NAFServer.src.Application.Handlers.ResourceRequestHandler
{
    public class SharedFolderRequestHandler : IResourceRequestHandler
    {
        private readonly IResourceRequestRepository _resourceRequestRepository;
        private readonly AppDbContext _context;
        public int ResourceId => 3;

        public SharedFolderRequestHandler(IResourceRequestRepository resourceRequestRepository, AppDbContext context)
        {
            _resourceRequestRepository = resourceRequestRepository;
            _context = context;
        }

        public Type AdditionalInfoType => typeof(SharedFolderRequestInfo);

        public async Task<bool> Validate(ResourceRequestAdditionalInfo AdditionalInfo, Guid nafId)
        {
            var info = AdditionalInfo as SharedFolderRequestInfo ?? throw new ArgumentException("Invalid additional info type.");
            bool sharedFolderExists = await _resourceRequestRepository.ResourceRequestExistsAsync<SharedFolderRequestInfo>
            (
                nafId,
                info.SharedFolderId,
                info => info.SharedFolderId
            );

            return !sharedFolderExists;
        }

        public object GetSchema()
        {
            throw new NotImplementedException();
        }

        public async Task<ResourceRequestAdditionalInfo> CreateAdditionalInfo(JsonElement dto)
        {
            var info = dto.Deserialize<SharedFolderInfoRequestDTO>()
                ?? throw new Exception("Invalid Shared Folder request payload");

            var folder = await _context.SharedFolders
                .FindAsync(info.SharedFolderId)
                ?? throw new KeyNotFoundException("SharedFolder not found");

            var additionalInfo = new SharedFolderRequestInfo(info.SharedFolderId)
            {
                SharedFolder = folder
            };

            return additionalInfo;
        }


    }
}
