using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface IGroupEmailRepository
    {
        Task<List<GroupEmail>> GetAllAsync();
    }
}
