# Enable TCP/IP for SQL Server Express
# Run this script as Administrator

Write-Host "Enabling TCP/IP for SQL Server Express..." -ForegroundColor Green

# Enable TCP/IP in registry
$regPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp"
Set-ItemProperty -Path $regPath -Name "Enabled" -Value 1 -Force

Write-Host "✓ TCP/IP enabled in registry" -ForegroundColor Green

# Restart SQL Server service
Write-Host "Restarting SQL Server service..." -ForegroundColor Yellow
Restart-Service -Name "MSSQL`$SQLEXPRESS" -Force

Write-Host "✓ SQL Server restarted" -ForegroundColor Green
Write-Host ""
Write-Host "TCP/IP is now enabled! You can now connect using:" -ForegroundColor Green
Write-Host "  Server: localhost" -ForegroundColor Cyan
Write-Host "  Port: 1433" -ForegroundColor Cyan
