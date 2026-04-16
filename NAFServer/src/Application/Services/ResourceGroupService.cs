using NAFServer.src.Application.DTOs.ResourceGroup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;
using NAFServer.src.Infrastructure.Persistence;
using NAFServer.src.Mapper;

namespace NAFServer.src.Application.Services
{
    public class ResourceGroupService : IResourceGroupService
    {
        private readonly IResourceGroupRepository _resourceGroupRepository;
        private readonly IResourceRepository _resourceRepository;
        private readonly AppDbContext _context;

        public ResourceGroupService(
            IResourceGroupRepository resourceGroupRepository,
            IResourceRepository resourceRepository,
            AppDbContext context)
        {
            _resourceGroupRepository = resourceGroupRepository;
            _resourceRepository = resourceRepository;
            _context = context;
        }

        public async Task<List<ResourceGroupDTO>> GetAllGroupsAsync()
        {
            var groups = await _resourceGroupRepository.GetAllGroupsAsync();
            return groups.Select(ToDTO).ToList();
        }

        public async Task<ResourceGroupDTO> AddResourceToGroupAsync(int groupId, int resourceId)
        {
            var group = await _resourceGroupRepository.GetGroupByIdAsync(groupId)
                ?? throw new KeyNotFoundException($"Resource group {groupId} not found.");

            var resource = await _resourceRepository.GetResourceByIdAsync(resourceId);

            resource.AssignToGroup(groupId);
            await _context.SaveChangesAsync();

            _resourceGroupRepository.InvalidateCache();

            var updated = await _resourceGroupRepository.GetGroupByIdAsync(groupId)
                ?? throw new KeyNotFoundException($"Resource group {groupId} not found after update.");

            return ToDTO(updated);
        }

        public async Task<ResourceGroupDTO> RemoveResourceFromGroupAsync(int groupId, int resourceId)
        {
            var resource = await _resourceRepository.GetResourceByIdAsync(resourceId);

            if (resource.ResourceGroupId != groupId)
                throw new InvalidOperationException("Resource does not belong to this group.");

            if (!resource.IsActiveInGroup)
                throw new InvalidOperationException("Resource is already inactive in this group.");

            resource.RemoveFromGroup();
            await _context.SaveChangesAsync();

            _resourceGroupRepository.InvalidateCache();

            var updated = await _resourceGroupRepository.GetGroupByIdAsync(groupId)
                ?? throw new KeyNotFoundException($"Resource group {groupId} not found after update.");

            return ToDTO(updated);
        }

        private static ResourceGroupDTO ToDTO(Domain.Entities.ResourceGroup group)
        {
            return new ResourceGroupDTO(
                group.Id,
                group.Name,
                group.CanOwnMany,
                group.CanChangeWithoutAPproval,
                group.Resources.Select(ResourceMapper.ToDTO).ToList()
            );
        }
    }
}
