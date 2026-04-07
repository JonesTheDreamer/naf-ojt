using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Application.Interfaces;
using NAFServer.src.Domain.Interface.Repository;

namespace NAFServer.src.Application.Services
{
    public class GroupEmailService : IGroupEmailService
    {
        private readonly IGroupEmailRepository _repo;

        public GroupEmailService(IGroupEmailRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<GroupEmailDTO>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(i => new GroupEmailDTO(i.Id, i.Email, i.DepartmentId)).ToList();
        }
    }
}
