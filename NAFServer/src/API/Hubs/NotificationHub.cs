using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NAFServer.src.Domain.Interface.Repository;
using System.Security.Claims;

namespace NAFServer.src.API.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly IUserRepository _userRepository;

        public NotificationHub(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public override async Task OnConnectedAsync()
        {
            var employeeId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (employeeId != null)
            {
                try
                {
                    var user = await _userRepository.GetUserByEmployeeId(employeeId);
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{user.Id}");
                }
                catch (KeyNotFoundException) { }
            }
            await base.OnConnectedAsync();
        }
    }
}
