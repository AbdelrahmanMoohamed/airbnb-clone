namespace DAL.Repo.Implementation
{
    public class PaymentRepository : GenericRepository<Payment>, IPaymentRepository
    {
        public PaymentRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<Payment>> GetPaymentsByBookingAsync(int bookingId)
        {
            return await _context.Payments
                .Where(p => p.BookingId == bookingId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Payment>> GetSuccessfulPaymentsAsync()
        {
            return await _context.Payments
                .Where(p => p.Status == PaymentStatus.Success)
                .ToListAsync();
        }
    }
}
