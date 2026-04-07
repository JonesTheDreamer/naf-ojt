using NAFServer.src.Application.DTOs.Lookup;

namespace NAFServer.src.Application.Interfaces
{
    public interface IInternetPurposeService
    {
        Task<List<InternetPurposeDTO>> GetAllAsync();
    }
}
