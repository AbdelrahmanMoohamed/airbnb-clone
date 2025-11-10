namespace DAL.Configurations
{
    public class KeywordConfiguration : IEntityTypeConfiguration<Keyword>
    {
        public void Configure(EntityTypeBuilder<Keyword> builder)
        {
            builder.HasKey(k => k.Id);

            builder.Property(k => k.Word)
                .IsRequired()
                .HasMaxLength(50);

            // Relationships
            builder.HasMany(k => k.Listings)
                .WithMany(l => l.Keywords)
                .UsingEntity(j => j.ToTable("ListingKeywords"));
        }
    }
}
















//public void Configure(EntityTypeBuilder<Keyword> builder)
//{
//    // Table name (optional, EF Core default is fine)
//    builder.ToTable("Keywords");

//    // Primary key
//    builder.HasKey(k => k.Id);

//    // Properties
//    builder.Property(k => k.Word)
//           .IsRequired()
//           .HasMaxLength(100);

//    // Relationships: Many-to-many with Listing
//    builder.HasMany(k => k.Listings)
//           .WithMany(l => l.Keywords)
//           .UsingEntity<Dictionary<string, object>>(
//                "ListingKeywords",       // Join table name
//                j => j.HasOne<Listing>()
//                      .WithMany()
//                      .HasForeignKey("ListingId")
//                      .OnDelete(DeleteBehavior.Cascade),
//                j => j.HasOne<Keyword>()
//                      .WithMany()
//                      .HasForeignKey("KeywordId")
//                      .OnDelete(DeleteBehavior.Cascade),
//                j =>
//                {
//                    j.HasKey("ListingId", "KeywordId"); // Composite primary key
//                }
//           );
//}