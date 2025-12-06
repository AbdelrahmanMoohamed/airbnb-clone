
using DAL.Repo.Abstraction;
using System.Text.RegularExpressions;

namespace PL.Helpers
{
    public static class Seeder
    {
        public static async Task SeedIfNeededAsync(IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var services = scope.ServiceProvider;

            var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var userManager = services.GetRequiredService<UserManager<User>>();
            var uow = services.GetRequiredService<IUnitOfWork>();

            // check if already seeded by looking for admin1
            var admin1Email = "admin1@airbnbclone.com";
            var existing = await userManager.FindByEmailAsync(admin1Email);
            if (existing != null)
                return; // already seeded

            // ensure roles
            string[] roles = { "Admin", "Host", "Guest" };
            foreach (var r in roles)
            {
                if (!await roleManager.RoleExistsAsync(r))
                    await roleManager.CreateAsync(new IdentityRole<Guid>(r));
            }

            //create system user with static id
            //var systemUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var systemUser = User.Create("System", DAL.Enum.UserRole.Admin);
            systemUser.Email = "system@airbnb.com";
            systemUser.UserName = "system";
            await userManager.CreateAsync(systemUser, "system123");
            await userManager.AddToRoleAsync(systemUser, "Admin");
            //systemUser.Id = systemUserId;
            

            // create admins
            var admin1 = User.Create("Admin One", DAL.Enum.UserRole.Admin);
            admin1.Email = admin1Email;
            admin1.UserName = "admin1";
            await userManager.CreateAsync(admin1, "Admin@123");
            await userManager.AddToRoleAsync(admin1, "Admin");

            var admin2 = User.Create("Admin Two", DAL.Enum.UserRole.Admin);
            admin2.Email = "admin2@airbnbclone.com";
            admin2.UserName = "admin2";
            await userManager.CreateAsync(admin2, "Admin@123");
            await userManager.AddToRoleAsync(admin2, "Admin");

            // create regular users
            var users = new List<User>();
            for (int i = 1; i <= 50; i++)
            {
                var email = $"user{i}@gmail.com";
                var u = User.Create($"User {i}", DAL.Enum.UserRole.Guest);
                u.Email = email;
                // sanitize username
                var baseName = Regex.Replace($"user{i}", "[^a-zA-Z0-9]", string.Empty);
                u.UserName = string.IsNullOrWhiteSpace(baseName) ? Guid.NewGuid().ToString("N") : baseName;
                await userManager.CreateAsync(u, "user123");
                await userManager.AddToRoleAsync(u, "Guest");
                users.Add(u);
            }

            // Initialize random and owners list
            var rnd = new Random();
            var owners = new List<User> { admin1, admin2 }.Concat(users).ToList();

            // Egyptian locations data
            var egyptianCities = new[]
            {
                new { Name = "Cairo", Lat = 30.0444, Lng = 31.2357, Areas = new[] { "Zamalek", "Maadi", "Heliopolis", "New Cairo", "6th October", "Nasr City", "Downtown Cairo", "Garden City" } },
                new { Name = "Alexandria", Lat = 31.2001, Lng = 29.9187, Areas = new[] { "Stanley", "Sidi Gaber", "San Stefano", "Montazah", "Smouha", "Miami" } },
                new { Name = "Giza", Lat = 30.0131, Lng = 31.2089, Areas = new[] { "Pyramids", "Dokki", "Mohandessin", "Sheikh Zayed", "October Gardens" } },
                new { Name = "Luxor", Lat = 25.6872, Lng = 32.6396, Areas = new[] { "East Bank", "West Bank", "Karnak", "Valley of Kings Area" } },
                new { Name = "Aswan", Lat = 24.0889, Lng = 32.8998, Areas = new[] { "Corniche", "Old Cataract", "Nubian Village" } },
                new { Name = "Hurghada", Lat = 27.2579, Lng = 33.8116, Areas = new[] { "Marina", "El Gouna", "Sahl Hasheesh", "Makadi Bay" } },
                new { Name = "Sharm El Sheikh", Lat = 27.9158, Lng = 34.3300, Areas = new[] { "Naama Bay", "Sharks Bay", "Hadaba", "Nabq Bay" } },
                new { Name = "Dahab", Lat = 28.4950, Lng = 34.5130, Areas = new[] { "Masbat", "Assalah", "Laguna" } },
                new { Name = "Marsa Alam", Lat = 25.0631, Lng = 34.8945, Areas = new[] { "Port Ghalib", "Abu Dabbab", "Quseir" } },
                new { Name = "Siwa Oasis", Lat = 29.2030, Lng = 25.5196, Areas = new[] { "Shali", "Cleopatra Spring", "Mountain of the Dead" } },
                new { Name = "Fayoum", Lat = 29.3084, Lng = 30.8428, Areas = new[] { "Tunis Village", "Wadi El Rayan", "Lake Qarun" } },
                new { Name = "Port Said", Lat = 31.2653, Lng = 32.3019, Areas = new[] { "Port Fouad", "El Manakh", "El Arab" } }
            };

            var amenitiesList = new[]
            {
                new[] { "WiFi", "Air Conditioning", "Kitchen", "TV", "Parking" },
                new[] { "WiFi", "Swimming Pool", "Gym", "Sea View", "Balcony" },
                new[] { "WiFi", "Kitchen", "Washing Machine", "Workspace", "Parking" },
                new[] { "WiFi", "Air Conditioning", "Hot Tub", "Garden", "BBQ Grill" },
                new[] { "WiFi", "Pool", "Beach Access", "Restaurant", "Spa" },
                new[] { "WiFi", "Desert View", "Traditional Decor", "Outdoor Seating", "Stargazing Deck" },
                new[] { "WiFi", "Nile View", "Rooftop Terrace", "Historic Building", "City Center" },
                new[] { "WiFi", "Pyramid View", "24h Security", "Concierge", "Airport Shuttle" },
                new[] { "WiFi", "Diving Center", "Snorkeling Gear", "Beach Towels", "Water Sports" },
                new[] { "WiFi", "Mountain View", "Hiking Trails", "Breakfast Included", "Tour Guide" }
            };

            var propertyTypes = new[] { "Apartment", "Villa", "Hotel Room", "Guesthouse", "Resort", "Chalet", "Studio", "Penthouse", "Duplex", "Traditional House" };
            var descriptions = new[]
            {
                "Beautiful property with stunning views and modern amenities. Perfect for families and couples.",
                "Luxurious accommodation in the heart of the city. Experience authentic Egyptian hospitality.",
                "Charming place with traditional Egyptian architecture and contemporary comfort.",
                "Spacious and well-equipped property ideal for long stays and business trips.",
                "Beachfront paradise with direct access to crystal clear waters and white sandy beaches.",
                "Historic property renovated to modern standards while preserving its unique character.",
                "Cozy retreat with breathtaking desert views and peaceful atmosphere.",
                "Modern apartment with all amenities in a prime location close to major attractions.",
                "Family-friendly villa with private pool and garden, perfect for memorable vacations.",
                "Elegant suite with panoramic views and top-notch facilities for discerning travelers."
            };

            // seed 200 listings across Egypt
            var listings = new List<Listing>();
            for (int i = 1; i <= 200; i++)
            {
                var owner = owners[rnd.Next(owners.Count)];
                var city = egyptianCities[rnd.Next(egyptianCities.Length)];
                var area = city.Areas[rnd.Next(city.Areas.Length)];
                var amenities = amenitiesList[rnd.Next(amenitiesList.Length)];
                var propertyType = propertyTypes[rnd.Next(propertyTypes.Length)];
                var description = descriptions[rnd.Next(descriptions.Length)];

                // Vary coordinates slightly within the city
                var latVariation = (rnd.NextDouble() - 0.5) * 0.1; // ±0.05 degrees
                var lngVariation = (rnd.NextDouble() - 0.5) * 0.1;

                var listing = Listing.Create(
                    title: $"{propertyType} in {area}, {city.Name}",
                    description: description,
                    pricePerNight: 30 + rnd.Next(0, 470), // 30-500 EGP range
                    location: $"{area}, {city.Name}",
                    latitude: city.Lat + latVariation,
                    longitude: city.Lng + lngVariation,
                    maxGuests: 1 + rnd.Next(1, 8),
                    userId: owner.Id,
                    createdBy: owner.FullName,
                    mainImageUrl: $"https://images.unsplash.com/photo-{1500000000000 + rnd.Next(0, 100000000)}?w=800",
                    destination: city.Name,
                    type: propertyType,
                    numberOfRooms: 1 + rnd.Next(0, 5),
                    numberOfBathrooms: 1 + rnd.Next(0, 3),
                    keywordNames: amenities.ToList()
                );

                await uow.Listings.AddAsync(listing);
                listings.Add(listing);

                // Batch save every 50 listings to improve performance
                if (i % 50 == 0)
                    await uow.SaveChangesAsync();
            }

            await uow.SaveChangesAsync();

            // seed 100 bookings with varied statuses
            for (int b = 0; b < 100; b++)
            {
                var listing = listings[rnd.Next(listings.Count)];
                var guest = owners.Where(u => u.Id != listing.UserId).OrderBy(x => rnd.Next()).First();
                
                // Mix of past, current, and future bookings
                var daysOffset = rnd.Next(-90, 180); // From 90 days ago to 180 days in future
                var checkIn = DateTime.UtcNow.AddDays(daysOffset);
                var checkOut = checkIn.AddDays(rnd.Next(1, 14));
                var nights = (decimal)(checkOut - checkIn).TotalDays;
                var total = nights * listing.PricePerNight;

                var booking = await uow.Bookings.CreateAsync(listing.Id, guest.Id, checkIn, checkOut, total);
                
                // Set booking status based on dates
                if (checkOut < DateTime.UtcNow)
                {
                    booking.Update(checkIn, checkOut, total, DAL.Enum.BookingPaymentStatus.Paid, DAL.Enum.BookingStatus.Completed);
                }
                else if (checkIn <= DateTime.UtcNow && checkOut >= DateTime.UtcNow)
                {
                    booking.Update(checkIn, checkOut, total, DAL.Enum.BookingPaymentStatus.Paid, DAL.Enum.BookingStatus.Confirmed);
                }
                else
                {
                    booking.Update(checkIn, checkOut, total, DAL.Enum.BookingPaymentStatus.Pending, DAL.Enum.BookingStatus.Pending);
                }

                // Save booking first to get the ID
                await uow.SaveChangesAsync();

                // create a payment for the booking
                var paymentStatus = booking.BookingStatus == DAL.Enum.BookingStatus.Completed 
                    ? DAL.Enum.PaymentStatus.Success 
                    : DAL.Enum.PaymentStatus.Pending;
                    
                var payment = DAL.Entities.Payment.Create(
                    booking.Id, 
                    booking.TotalPrice, 
                    "card", 
                    Guid.NewGuid().ToString(), 
                    paymentStatus, 
                    DateTime.UtcNow
                );
                await uow.Payments.AddAsync(payment);

                // Batch save every 25 bookings
                if (b % 25 == 24)
                    await uow.SaveChangesAsync();
            }

            await uow.SaveChangesAsync();

            // seed messages
            for (int m = 0; m < 50; m++)
            {
                var sender = owners[rnd.Next(owners.Count)];
                var receiver = owners.Where(u => u.Id != sender.Id).OrderBy(x => rnd.Next()).First();
                await uow.Messages.CreateAsync(sender.Id, receiver.Id, $"Hello from {sender.FullName} (msg {m})", DateTime.UtcNow.AddMinutes(-m), false);
            }

            // seed notifications
            var allUsers = owners;
            foreach (var u in allUsers)
            {
                await uow.Notifications.CreateAsync(u.Id, "Welcome to Airbnb Clone!", $"Hi {u.FullName}! We're excited to have you here. Explore amazing stays around the world.", DAL.Enum.NotificationType.System, "/onboarding", "Start Tour");
            }

            await uow.SaveChangesAsync();
        }
    }
}
