namespace NAFServer.src.Application.Services
{
    using NAFServer.src.Application.Interfaces;
    using System.Security.Claims;

    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid UserId
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;

                if (user == null || !user.Identity!.IsAuthenticated)
                    throw new UnauthorizedAccessException("User is not authenticated.");

                var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (id == null)
                    throw new UnauthorizedAccessException("User ID claim not found.");

                return Guid.Parse(id);
            }
        }

        public bool IsAuthenticated =>
            _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
    }
}
