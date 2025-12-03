-- Mark migrations as applied in history
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20251130053434_InitialCreate')
BEGIN
    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES ('20251130053434_InitialCreate', '9.0.10');
END

IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20251130060101_AddActionFieldsToNotification')
BEGIN
    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES ('20251130060101_AddActionFieldsToNotification', '9.0.10');
END

-- Add IsFirstLogin column if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsFirstLogin')
BEGIN
    ALTER TABLE Users ADD IsFirstLogin bit NOT NULL DEFAULT 1;
END

-- Add ActionUrl and ActionLabel columns if they don't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Notifications') AND name = 'ActionUrl')
BEGIN
    ALTER TABLE Notifications ADD ActionUrl nvarchar(500) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Notifications') AND name = 'ActionLabel')
BEGIN
    ALTER TABLE Notifications ADD ActionLabel nvarchar(100) NULL;
END
