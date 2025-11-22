namespace BLL.ModelVM.Payment
{
    public class CreatePaymentVM
    {
        public int BookingId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = null!;
    }
}