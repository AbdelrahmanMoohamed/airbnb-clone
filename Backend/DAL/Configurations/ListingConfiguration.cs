namespace DAL.Configurations
{
    public class ListingConfiguration : IEntityTypeConfiguration<Listing>
    {
        public void Configure(EntityTypeBuilder<Listing> builder)
        {
            builder.HasKey(l => l.Id);

            builder.Property(l => l.Title)
                   .HasMaxLength(150)
                   .IsRequired();

            builder.Property(l => l.Description)
                   .HasMaxLength(2000)
                   .IsRequired();

            builder.Property(l => l.Location)
                   .HasMaxLength(255)
                   .IsRequired();

            builder.Property(l => l.PricePerNight)
                   .HasColumnType("decimal(18,2)");

            builder.Property(l => l.Latitude)
                   .HasColumnType("decimal(9,6)");

            builder.Property(l => l.Longitude)
                   .HasColumnType("decimal(9,6)");

            builder.Property(l => l.CreatedAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(l => l.IsPromoted)
                   .HasDefaultValue(false);

            builder.Property(l => l.PromotionEndDate)
                   .IsRequired(false);

            // Relationships
            builder.HasOne(l => l.User)
                   .WithMany(u => u.Listings)
                   .HasForeignKey(l => l.UserId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(l => l.Bookings)
                   .WithOne(b => b.Listing)
                   .HasForeignKey(b => b.ListingId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
