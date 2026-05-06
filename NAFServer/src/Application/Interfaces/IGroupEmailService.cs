using NAFServer.src.Application.DTOs.Lookup;
using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Application.Interfaces
{
    public interface IGroupEmailService
    {
        Task<List<GroupEmailDTO>> GetAllAsync();
        Task<GroupEmail> FindOrCreateAsync(string email);
    }
}
