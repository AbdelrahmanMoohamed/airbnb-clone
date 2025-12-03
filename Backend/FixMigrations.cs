using Microsoft.Data.SqlClient;
using System.IO;

var connectionString = "Server=(localdb)\\MSSQLLocalDB;Database=AirbnbClone;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
var sql = File.ReadAllText("fix-migrations.sql");

using var connection = new SqlConnection(connectionString);
connection.Open();

using var command = new SqlCommand(sql, connection);
command.ExecuteNonQuery();

Console.WriteLine("Migration history fixed successfully!");
