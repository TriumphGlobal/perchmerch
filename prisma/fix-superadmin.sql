-- Update existing user to have correct role and permissions
UPDATE "User"
SET 
    role = 'SUPERADMIN',
    "isSuperAdmin" = true,
    "isPlatformAdmin" = true,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE email = 'sales@triumphglobal.net';

-- If user doesn't exist, create it
INSERT INTO "User" (
    id,
    email,
    name,
    role,
    "isSuperAdmin",
    "isPlatformAdmin",
    "hashedPassword",
    "createdAt",
    "updatedAt",
    "referralEarnings"
)
SELECT 
    'clsuperadmin',
    'sales@triumphglobal.net',
    'PerchMerch Admin',
    'SUPERADMIN',
    true,
    true,
    '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    0
WHERE NOT EXISTS (
    SELECT 1 FROM "User" WHERE email = 'sales@triumphglobal.net'
); 