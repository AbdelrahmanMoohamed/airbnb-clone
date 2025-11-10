namespace DAL.Repo.Abstraction
{
    public interface IPaymentRepository : IGenericRepository<Payment>
    {
        Task<IEnumerable<Payment>> GetPaymentsByBookingAsync(int bookingId);          // All payments of a specific booking
        Task<IEnumerable<Payment>> GetSuccessfulPaymentsAsync();                      // All successful payments
    }
}
