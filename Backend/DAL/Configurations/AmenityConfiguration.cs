namespace DAL.Configurations
{
    public class AmenityConfiguration : IEntityTypeConfiguration<Amenity>
    {
        public void Configure(EntityTypeBuilder<Amenity> builder)
        {
            builder.HasKey(a => a.Id);

            builder.Property(a => a.Name)
                .IsRequired()
                .HasMaxLength(100);

            // Relationships
            builder.HasMany(a => a.Listings)
                .WithMany(l => l.Amenities)
                .UsingEntity(j => j.ToTable("ListingAmenities"));
        }
    }
}
