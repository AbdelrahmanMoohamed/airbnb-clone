using DAL.Repo.Abstraction;

namespace PL.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : BaseController
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingController> _logger;
        private readonly IEmailService _emailService;
        private readonly EmailMappingService _emailMappingService;
        private readonly IUnitOfWork _uow;

        public BookingController(IBookingService bookingService, ILogger<BookingController> logger, IEmailService emailService, EmailMappingService emailMappingService, IUnitOfWork uow)
        {
            _bookingService = bookingService;
            _logger = logger;
            _emailService = emailService;
            _emailMappingService = emailMappingService;
            _uow = uow;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateBookingVM model)
        {
            try
            {
                var userId = GetUserIdFromClaims();

                _logger?.LogInformation(
                    "Booking Create request. userId={UserId}, listingId={ListingId}, checkIn={CheckIn}, checkOut={CheckOut}",
                    userId?.ToString() ?? "<null>", model?.ListingId, model?.CheckInDate, model?.CheckOutDate);

                if (userId == null)
                    return Unauthorized(new { success = false, errorMessage = "Unauthorized" });

                var resp = await _bookingService.CreateBookingAsync(userId.Value, model);

                if (!resp.Success)
                {
                    _logger?.LogWarning("Booking create failed: {Reason}", resp.errorMessage);
                    return BadRequest(new
                    {
                        success = false,
                        errorMessage = resp.errorMessage
                    });
                }

                return Ok(new
                {
                    success = true,
                    result = resp.result,
                    errorMessage = (string?)null
                });
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "CreateBooking exception");
                return StatusCode(500, new
                {
                    success = false,
                    errorMessage = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var userId = GetUserIdFromClaims();
                if (userId == null)
                    return Unauthorized(new { success = false, errorMessage = "Unauthorized" });

                var resp = await _bookingService.GetByIdAsync(userId.Value, id);

                if (!resp.Success)
                {
                    return BadRequest(new
                    {
                        success = false,
                        errorMessage = resp.errorMessage
                    });
                }

                return Ok(new
                {
                    success = true,
                    result = resp.result,
                    errorMessage = (string?)null
                });
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "GetById error for booking {BookingId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    errorMessage = "Failed to load booking"
                });
            }
        }

        [HttpPost("{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> Cancel(int id)
        {
            try
            {
                var userId = GetUserIdFromClaims();
                if (userId == null)
                    return Unauthorized(new { success = false, errorMessage = "Unauthorized" });

                var resp = await _bookingService.CancelBookingAsync(userId.Value, id);

                if (!resp.Success)
                    return BadRequest(new { success = false, errorMessage = resp.errorMessage });

                // Send cancellation email
                try
                {
                    var fullBooking = await _uow.Bookings.GetByIdWithListingAndHostAsync(id);
                    if (fullBooking != null)
                    {
                        var cancelVM = _emailMappingService.ToCancellationVM(fullBooking, cancelledByHost: false);
                        await _emailService.SendCancellationEmailAsync(cancelVM);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed sending cancellation email for booking {BookingId}", id);
                }

                return Ok(new { success = true, result = resp.result, errorMessage = (string?)null });
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Cancel booking error for {BookingId}", id);
                return StatusCode(500, new
                {
                    success = false,
                    errorMessage = "Failed to cancel booking"
                });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> MyBookings()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                if (userId == null) return Unauthorized();

                var resp = await _bookingService.GetBookingsByUserAsync(userId.Value);
                if (!resp.Success) return BadRequest(resp.errorMessage);

                return Ok(new { success = true, result = resp.result });
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "MyBookings error");
                return StatusCode(500, new { success = false, errorMessage = "Failed to load bookings" });
            }
        }

        [HttpGet("host/me")]
        [Authorize]
        public async Task<IActionResult> HostBookings()
        {
            try
            {
                var userId = GetUserIdFromClaims();
                if (userId == null) return Unauthorized();

                var resp = await _bookingService.GetBookingsByHostAsync(userId.Value);
                if (!resp.Success) return BadRequest(resp.errorMessage);

                return Ok(new { success = true, result = resp.result });
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "HostBookings error");
                return StatusCode(500, new { success = false, errorMessage = "Failed to load bookings" });
            }
        }
    }
}