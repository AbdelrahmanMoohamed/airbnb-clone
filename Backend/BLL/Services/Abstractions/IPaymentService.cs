
namespace BLL.Services.Abstractions
{
 public interface IPaymentService
 {
 Task<Response<CreatePaymentVM>> InitiatePaymentAsync(Guid userId, int bookingId, decimal amount, string method);
 Task<Response<bool>> ConfirmPaymentAsync(int bookingId, string transactionId);
 Task<Response<bool>> RefundPaymentAsync(int paymentId);
 }
}
