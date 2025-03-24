# Reset database script for PerchMerch
# This script will backup the current database and then reset it

# Load environment variables
$envPath = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Get database connection details
$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Host "Error: DATABASE_URL not found in .env file"
    exit 1
}

# Extract database name from URL
if ($dbUrl -match 'postgresql://[^/]+/([^?]+)') {
    $dbName = $matches[1]
} else {
    Write-Host "Error: Invalid DATABASE_URL format"
    exit 1
}

# Backup script path
$backupScript = Join-Path $PSScriptRoot "backup-db.sql"
$resetScript = Join-Path $PSScriptRoot "reset-db.sql"

# Run backup script
Write-Host "Creating database backup..."
psql $dbUrl -f $backupScript

# Run reset script
Write-Host "Resetting database..."
psql $dbUrl -f $resetScript

# Run Prisma migrations
Write-Host "Running Prisma migrations..."
npx prisma generate
npx prisma db push

Write-Host "Database reset complete!" 