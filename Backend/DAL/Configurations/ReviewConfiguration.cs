

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
                .IsRequired()
                .HasMaxLength(2000);

            builder.Property(r => r.CreatedAt)
                .HasDefaultValueSql("GETDATE()");
                
            builder.Property(r => r.UpdatedAt)
                .IsRequired(false);

            // Enhanced features
            builder.Property(r => r.HostReply)
                .HasMaxLength(2000)
                .IsRequired(false);

            builder.Property(r => r.HostReplyDate)
                .IsRequired(false);

            builder.Property(r => r.ImageUrls)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                )
                .HasMaxLength(4000)
                .IsRequired(false);

            builder.Property(r => r.HelpfulVotes)
                .HasDefaultValue(0);

            builder.Property(r => r.NotHelpfulVotes)
                .HasDefaultValue(0);

            builder.Property(r => r.IsFlagged)
                .HasDefaultValue(false);

            builder.Property(r => r.FlagReason)
                .HasMaxLength(500)
                .IsRequired(false);

            builder.Property(r => r.FlaggedAt)
                .IsRequired(false);

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
