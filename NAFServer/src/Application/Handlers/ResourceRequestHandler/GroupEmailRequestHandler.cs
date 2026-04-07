using NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using System.Text.Json;

namespace NAFServer.src.Application.Handlers.ResourceRequestHandler
{
    public class GroupEmailRequestHandler : IResourceRequestHandler
    {
        private readonly IResourceRequestRepository _resourceRequestRepository;
        private readonly AppDbContext _context;
        public int ResourceId => 2;

        public GroupEmailRequestHandler(IResourceRequestRepository resourceRequestRepository, AppDbContext context)
        {
            _resourceRequestRepository = resourceRequestRepository;
            _context = context;
        }

        public Type AdditionalInfoType => typeof(GroupEmailRequestInfo);

        public async Task<bool> Validate(ResourceRequestAdditionalInfo AdditionalInfo, Guid nafId)
        {
            var info = AdditionalInfo as GroupEmailRequestInfo ?? throw new ArgumentException("Invalid additional info type.");

            bool groupEmailExists = await _resourceRequestRepository.ResourceRequestExistsAsync<GroupEmailRequestInfo>
            (
                nafId,
                info.GroupEmailId,
                info => info.GroupEmailId
            );

            return !groupEmailExists;
        }

        public object GetSchema()
        {
            throw new NotImplementedException();
        }

        public async Task<ResourceRequestAdditionalInfo> CreateAdditionalInfo(JsonElement dto)
        {
            var info = dto.Deserialize<GroupEmailInfoRequestDTO>()
                ?? throw new Exception("Invalid Group Email request payload");
            var groupEmail = await _context.GroupEmails
                 .FindAsync(info.GroupEmailId)
                 ?? throw new KeyNotFoundException("GroupEmail not found");

            // Create AdditionalInfo object
            var additionalInfo = new GroupEmailRequestInfo(info.GroupEmailId)
            {
                GroupEmail = groupEmail
            };
            return additionalInfo;
        }


    }
}
