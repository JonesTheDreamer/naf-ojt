using NAFServer.src.Domain.Entities;

namespace NAFServer.src.Domain.Interface.Repository
{
    public interface ISharedFolderRepository
    {
        Task<List<SharedFolder>> GetAllAsync();
    }
}
