
namespace DAL.Configurations
{
    public class FaceIdConfiguration : IEntityTypeConfiguration<FaceId>
    {
        public void Configure(EntityTypeBuilder<FaceId> builder)
        {
            // Primary key
            builder.HasKey(f => f.Id);

            // Properties
            builder.Property(f => f.Encoding)
                   .IsRequired()
                   .HasColumnType("varbinary(max)"); // store byte[] as varbinary


            // Relationships
            builder.HasOne(f => f.User)
                .WithMany(u => u.FaceIds)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
