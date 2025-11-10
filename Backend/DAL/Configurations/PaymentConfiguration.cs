namespace DAL.Configurations
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Amount)
                   .HasColumnType("decimal(18,2)")
                   .IsRequired();

            builder.Property(p => p.PaymentMethod)
                   .HasMaxLength(50)
                   .IsRequired();

            builder.Property(p => p.TransactionId)
                   .HasMaxLength(100)
                   .IsRequired();

            builder.Property(p => p.Status)
                   .HasConversion<string>()
                   .HasMaxLength(20)
                   .HasDefaultValue(PaymentStatus.Success)
                   .IsRequired();

            builder.Property(p => p.PaidAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            // Relationships
            builder.HasOne(p => p.Booking)
                   .WithOne(b => b.Payment)
                   .HasForeignKey<Payment>(p => p.BookingId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}