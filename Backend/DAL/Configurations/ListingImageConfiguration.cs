namespace DAL.Configurations
{
    public class ListingImageConfiguration : IEntityTypeConfiguration<ListingImage>
    {
        public void Configure(EntityTypeBuilder<ListingImage> builder)
        {
            builder.HasKey(li => li.Id);

            builder.Property(li => li.ImageUrl)
                   .HasMaxLength(500)
                   .IsRequired();

            // Relationships
            builder.HasOne(li => li.Listing)
                   .WithMany(l => l.Images)
                   .HasForeignKey(li => li.ListingId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
