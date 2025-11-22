
namespace BLL.Services.Impelementation
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _uow;
        private readonly INotificationService _notificationService;

        public PaymentService(IUnitOfWork uow, INotificationService notificationService)
        {
            _uow = uow;
            _notificationService = notificationService;
        }

        // Initiate payment: create Payment record with Pending status; in real app call Stripe/PayPal
        public async Task<Response<CreatePaymentVM>> InitiatePaymentAsync(Guid userId, int bookingId, decimal amount, string method)
        {
            try
            {
                var booking = await _uow.Bookings.GetByIdAsync(bookingId);
                if (booking == null) return Response<CreatePaymentVM>.FailResponse("Booking not found");

                var transactionId = Guid.NewGuid().ToString();
                var payment = Payment.Create(bookingId, amount, method, transactionId, PaymentStatus.Pending, DateTime.UtcNow);
                await _uow.Payments.AddAsync(payment);
                await _uow.SaveChangesAsync();

                // attach payment to booking (optional linking in EF tracked entities)
                booking.Update(booking.CheckInDate, booking.CheckOutDate, booking.TotalPrice, BookingPaymentStatus.Pending, booking.BookingStatus);
                _uow.Bookings.Update(booking);
                await _uow.SaveChangesAsync();

                // send notification to guest
                await _notificationService.CreateAsync(new BLL.ModelVM.Notification.CreateNotificationVM { UserId = booking.GuestId, Title = "Payment Initiated", Body = $"Payment of {amount:C} initiated for booking {booking.Id}", CreatedAt = DateTime.UtcNow });

                var vm = new CreatePaymentVM { BookingId = bookingId, Amount = amount, PaymentMethod = method };
                return Response<CreatePaymentVM>.SuccessResponse(vm);
            }
            catch (Exception ex)
            {
                return Response<CreatePaymentVM>.FailResponse(ex.Message);
            }
        }

        // Confirm payment - mark payment success
        public async Task<Response<bool>> ConfirmPaymentAsync(int bookingId, string transactionId)
        {
            try
            {
                var payments = (await _uow.Payments.GetPaymentsByBookingAsync(bookingId)).ToList();
                var payment = payments.FirstOrDefault(p => p.TransactionId == transactionId);
                if (payment == null) return Response<bool>.FailResponse("Payment not found");

                payment.Update(payment.Amount, payment.PaymentMethod, payment.TransactionId, PaymentStatus.Success, DateTime.UtcNow);
                _uow.Payments.Update(payment);

                var booking = await _uow.Bookings.GetByIdAsync(bookingId);
                booking.Update(booking.CheckInDate, booking.CheckOutDate, booking.TotalPrice, BookingPaymentStatus.Paid, BookingStatus.Active);
                _uow.Bookings.Update(booking);

                await _uow.SaveChangesAsync();

                // notify guest & host
                await _notificationService.CreateAsync(new BLL.ModelVM.Notification.CreateNotificationVM { UserId = booking.GuestId, Title = "Payment Confirmed", Body = $"Payment confirmed for booking {booking.Id}", CreatedAt = DateTime.UtcNow });
                await _notificationService.CreateAsync(new BLL.ModelVM.Notification.CreateNotificationVM { UserId = booking.Listing.UserId, Title = "New Booking", Body = $"Your listing has a new confirmed booking {booking.Id}", CreatedAt = DateTime.UtcNow });

                return Response<bool>.SuccessResponse(true);
            }
            catch (Exception ex)
            {
                return Response<bool>.FailResponse(ex.Message);
            }
        }

        // Refund payment - set status to Refunded
        public async Task<Response<bool>> RefundPaymentAsync(int paymentId)
        {
            try
            {
                var payment = await _uow.Payments.GetByIdAsync(paymentId);
                if (payment == null) return Response<bool>.FailResponse("Payment not found");

                payment.Update(payment.Amount, payment.PaymentMethod, payment.TransactionId, PaymentStatus.Refunded, DateTime.UtcNow);
                _uow.Payments.Update(payment);
                await _uow.SaveChangesAsync();

                // notify user
                var booking = await _uow.Bookings.GetByIdAsync(payment.BookingId);
                await _notificationService.CreateAsync(new BLL.ModelVM.Notification.CreateNotificationVM { UserId = booking.GuestId, Title = "Payment Refunded", Body = $"Payment for booking {booking.Id} has been refunded", CreatedAt = DateTime.UtcNow });

                return Response<bool>.SuccessResponse(true);
            }
            catch (Exception ex)
            {
                return Response<bool>.FailResponse(ex.Message);
            }
        }
    }
}
