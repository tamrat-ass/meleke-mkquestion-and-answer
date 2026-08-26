# Enable SQL Server Authentication and set SA password
# Run this in PowerShell as Administrator

$sqlInstance = "localhost\SQLEXPRESS"
$saPassword = "YourPassword123"

# Connect to SQL Server and enable SQL Authentication
$query = @"
-- Enable SQL Server and Windows Authentication
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2;

-- Set SA password
ALTER LOGIN sa WITH PASSWORD = '$saPassword';
ALTER LOGIN sa ENABLE;
"@

Write-Host "Enabling SQL Server Authentication..."
Write-Host "This requires SQL Server to be restarted."
Write-Host ""
Write-Host "Please run this command in SQL Server Management Studio:"
Write-Host $query
