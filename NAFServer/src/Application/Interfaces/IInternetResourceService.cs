using NAFServer.src.Application.DTOs.Lookup;

namespace NAFServer.src.Application.Interfaces
{
    public interface IInternetResourceService
    {
        Task<List<InternetResourceItemDTO>> GetAllAsync();
    }
}
