namespace NAFServer.src.Application.Services
{
    using NAFServer.src.Application.Interfaces;
    using NAFServer.src.Domain.Interface.Repository;
    using System.Security.Claims;

    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IEmployeeRepository _employeeRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUserLocationRepository _userLocationRepository;

        public CurrentUserService(
            IHttpContextAccessor httpContextAccessor,
            IEmployeeRepository employeeRepository,
            IUserRepository userRepository,
            IUserLocationRepository userLocationRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _employeeRepository = employeeRepository;
            _userRepository = userRepository;
            _userLocationRepository = userLocationRepository;
        }

        public string EmployeeId
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;

                if (user == null || !user.Identity!.IsAuthenticated)
                    throw new UnauthorizedAccessException("User is not authenticated.");

                var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (id == null)
                    throw new UnauthorizedAccessException("Employee ID claim not found.");

                return id;
            }
        }

        public string Role =>
            _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value ?? "";

        public bool IsAuthenticated =>
            _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

        public async Task<string> GetDepartmentIdAsync()
        {
            var employee = await _employeeRepository.GetByIdAsync(EmployeeId);
            return employee!.DepartmentId;
        }

        public async Task<int> GetLocationIdAsync()
        {
            var user = await _userRepository.GetUserByEmployeeId(EmployeeId);
            var location = await _userLocationRepository.GetUserActiveLocation(user.Id);
            return location.LocationId;
        }
    }
}
