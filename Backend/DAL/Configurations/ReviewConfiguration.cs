

namespace DAL.Configurations
{
    public class ReviewConfiguration : IEntityTypeConfiguration<Review>
    {
        public void Configure(EntityTypeBuilder<Review> builder)
        {
            builder.ToTable("Reviews");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.Rating)
                .IsRequired();

            builder.Property(r => r.Comment)
                .IsRequired();

            builder.Property(r => r.CreatedAt)
                .HasDefaultValueSql("GETDATE()");

            // Relationships
            builder.HasOne(r => r.Booking)
                .WithOne(b => b.Review)
                .HasForeignKey<Review>(r => r.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(r => r.Guest)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.GuestId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
