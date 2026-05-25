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
        private readonly ILocationRepository _locationRepository;

        public CurrentUserService(
            IHttpContextAccessor httpContextAccessor,
            IEmployeeRepository employeeRepository,
            IUserRepository userRepository,
            ILocationRepository locationRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _employeeRepository = employeeRepository;
            _userRepository = userRepository;
            _locationRepository = locationRepository;
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
            return employee?.DepartmentId ?? string.Empty;
        }

        public async Task<int> GetLocationIdAsync()
        {
            var employee = await _employeeRepository.GetByIdAsync(EmployeeId);
            if (employee?.Location is null) return 0;
            var location = await _locationRepository.GetByNameAsync(employee.Location);
            return location?.Id ?? 0;
        }
    }
}
