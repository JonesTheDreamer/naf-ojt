using NAFServer.src.Application.DTOs.Lookup;

namespace NAFServer.src.Application.Interfaces
{
    public interface IGroupEmailService
    {
        Task<List<GroupEmailDTO>> GetAllAsync();
    }
}
