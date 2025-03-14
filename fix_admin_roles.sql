-- Ensure the admin user exists with correct privileges
INSERT INTO "User" ("id", "email", "name", "role", "isSuperAdmin", "isPlatformAdmin", "createdAt", "updatedAt")
VALUES (
    'clsuperadmin',
    'sales@triumphglobal.net',
    'PerchMerch Admin',
    'SUPER_ADMIN',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE
SET 
    "role" = 'SUPER_ADMIN',
    "isSuperAdmin" = true,
    "isPlatformAdmin" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

-- Create a function to maintain admin privileges
CREATE OR REPLACE FUNCTION maintain_admin_privileges()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user is sales@triumphglobal.net, ensure they keep admin privileges
    IF NEW.email = 'sales@triumphglobal.net' THEN
        NEW.role := 'SUPER_ADMIN';
        NEW.isSuperAdmin := true;
        NEW.isPlatformAdmin := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain admin privileges
DROP TRIGGER IF EXISTS maintain_admin_trigger ON "User";
CREATE TRIGGER maintain_admin_trigger
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION maintain_admin_privileges(); 