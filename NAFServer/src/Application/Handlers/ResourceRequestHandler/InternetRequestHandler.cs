using NAFServer.src.Application.DTOs.ResourceRequest.AdditionalInfo;
using NAFServer.src.Application.Handlers.Interface;
using NAFServer.src.Domain.Entities;
using NAFServer.src.Domain.Interface;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using System.Text.Json;

namespace NAFServer.src.Application.Handlers.ResourceRequestHandler
{
    public class InternetRequestHandler : IResourceRequestHandler
    {
        private readonly IResourceRequestRepository _resourceRequestRepository;
        private readonly IInternetResourceRepository _internetResourceRepository;
        private readonly AppDbContext _context;
        public int ResourceId => 1;

        public InternetRequestHandler(IResourceRequestRepository resourceRequestRepository, IInternetResourceRepository internetResourceRepository, AppDbContext context)
        {
            _resourceRequestRepository = resourceRequestRepository;
            _internetResourceRepository = internetResourceRepository;
            _context = context;
        }

        public Type AdditionalInfoType => typeof(InternetRequestInfo);

        public async Task<bool> Validate(ResourceRequestAdditionalInfo AdditionalInfo, Guid nafId)
        {
            var info = AdditionalInfo as InternetRequestInfo ?? throw new ArgumentException("Invalid additional info type.");

            bool internetExists = await _resourceRequestRepository.ResourceRequestExistsAsync<InternetRequestInfo>(
                nafId,
                info.InternetResourceId,
                info => info.InternetResourceId
            );

            return !internetExists;
        }

        public object GetSchema()
        {
            throw new NotImplementedException();
        }

        public async Task<ResourceRequestAdditionalInfo> CreateAdditionalInfo(JsonElement dto)
        {
            var info = dto.Deserialize<InternetInfoRequestDTO>()
                ?? throw new Exception("Invalid Internet request payload");

            var internetResource = await _internetResourceRepository.GetByIdAsync(info.InternetResourceId);

            var additionalInfo = new InternetRequestInfo(info.InternetResourceId)
            {
                InternetResource = internetResource
            };


            return additionalInfo;
        }


    }
}
