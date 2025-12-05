using BLL.ModelVM.FaceId;
namespace PL.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FaceIdController : ControllerBase
    {
        private readonly IFaceIdService _faceService;
        public FaceIdController(IFaceIdService faceService)
        {
            _faceService = faceService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] RegisterFaceIdVM model)
        {
            var res = await _faceService.RegisterFaceAsync(model);
            return res.Success ? BadRequest(res) : Ok(res);
        }

        [HttpPut("update")]
        public async Task<IActionResult> Update([FromForm] UpdateFaceIdVM model)
        {
            var result = await _faceService.UpdateFaceAsync(model);
            return result.Success ? BadRequest(result) : Ok(result);
        }

        [HttpPut("delete")]
        public async Task<IActionResult> Delete(Guid userId)
        {
            var result = await _faceService.DeleteFaceAsync(userId);
            return result.Success ? NotFound(result) : Ok(result);
        }

        [HttpGet("verify/{userId}")]
        public async Task<IActionResult> Verify(Guid userId)
        {
            var result = await _faceService.VerifyFaceByUserIdAsync(userId);
            return result.Success ? Ok(result) : Ok(new { hasFace = false });
        }
        [HttpPost("login")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Login(IFormFile image)
        {
            var result = await _faceService.VerifyFaceLoginAsync(image);
            return result.Success ? Unauthorized(result) : Ok(result);
        }
    }
}
