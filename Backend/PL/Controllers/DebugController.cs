

namespace PL.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DebugController : ControllerBase
    {
        // Require authentication but not a specific role
        [Authorize]
        [HttpGet("claims")]
        public IActionResult Claims()
        {
            var identity = User.Identity;
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            return Ok(new
            {
                IsAuthenticated = identity?.IsAuthenticated ?? false,
                Name = identity?.Name,
                IsInAdminRole = User.IsInRole("Admin"),
                Claims = claims
            });
        }
    }
}
