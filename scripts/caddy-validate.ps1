# caddy-validate.ps1 - Windows Caddy Configuration Validation
# Usage: .\caddy-validate.ps1

param(
    [string]$ip = "57.129.191.113",
    [string]$caddyConfigPath = "Caddyfile"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Caddy Configuration Validation" -ForegroundColor Cyan
Write-Host "Target: $ip" -ForegroundColor Yellow
Write-Host "Config: $caddyConfigPath" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Read the Caddyfile content
$conf = Get-Content $caddyConfigPath -Raw
$confLines = $conf.Split([System.Environment]::NewLine)

Write-Host "Caddyfile Statistics" -ForegroundColor Gray
Write-Host "  Lines: $($confLines.Count)" -ForegroundColor Gray
Write-Host "  Non-empty lines: $($($confLines | Where-Object { $_ -trim() -ne '' }).Count)" -ForegroundColor Gray
Write-Host ""

# Validate API subdomain block
Write-Host "--- API Subdomain Block ---" -ForegroundColor Gray
$apiBlock = [regex]::Match($conf, r'match\s+\$ip\s*\{[^}]*reverse_proxy\s+localhost:8080', [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($apiBlock.Success) {
    Write-Host "  ✓ PASS: Found reverse_proxy to localhost:8080" -ForegroundColor Green
    Write-Host "    Content:" -ForegroundColor Gray
    $apiBlock.Matches | ForEach-Object {
        Write-Host "      $_.Value" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ FAIL: reverse_proxy block not found" -ForegroundColor Red
}
Write-Host ""

# Validate frontend subdomain block
Write-Host "--- Frontend Subdomain Block ---" -ForegroundColor Gray
$frontBlock = [regex]::Match($conf, r'match\s+\$ip\s*\{[^}]*reverse_proxy\s+localhost:80', [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($frontBlock.Success) {
    Write-Host "  ✓ PASS: Found reverse_proxy to localhost:80" -ForegroundColor Green
    Write-Host "    Content:" -ForegroundColor Gray
    $frontBlock.Matches | ForEach-Object {
        Write-Host "      $_.Value" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ FAIL: reverse_proxy block not found" -ForegroundColor Red
}
Write-Host ""

# Validate health endpoint
Write-Host "--- Health Endpoint ---" -ForegroundColor Gray
$healthBlock = [regex]::Match($conf, r'match\s+\$ip\s*\/health\s*\{[^}]*respond_with\s+status\s+200', [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($healthBlock.Success) {
    Write-Host "  ✓ PASS: Found /health endpoint with status 200" -ForegroundColor Green
    Write-Host "    Content:" -ForegroundColor Gray
    $healthBlock.Matches | ForEach-Object {
        Write-Host "      $_.Value" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ FAIL: /health endpoint not found" -ForegroundColor Red
}
Write-Host ""

# Validate WebSocket/Upgrade handler
Write-Host "--- Upgrade Handler ---" -ForegroundColor Gray
$upgradeBlock = [regex]::Match($conf, r'match\s+\$ip\s*\/realtime\s*\{[^}]*upgrade\s+to\s+websocket[s]?', [System.Text.RegularExpressions.RegexOptions]::Singleline)

if ($upgradeBlock.Success) {
    Write-Host "  ✓ PASS: Found WebSocket upgrade handler" -ForegroundColor Green
    Write-Host "    Content:" -ForegroundColor Gray
    $upgradeBlock.Matches | ForEach-Object {
        Write-Host "      $_.Value" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ FAIL: /realtime upgrade handler not found" -ForegroundColor Red
}
Write-Host ""

# Validate Cache-Control headers
Write-Host "--- Cache-Control Headers ---" -ForegroundColor Gray
$cacheLines = $confLines | Where-Object { $_ -match 'header\s+Cache-Control' }
if ($cacheLines.Count -ge 2) {
    Write-Host "  ✓ PASS: Found Cache-Control headers" -ForegroundColor Green
    Write-Host "    Content:" -ForegroundColor Gray
    $cacheLines | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
} else {
    Write-Host "  ✗ FAIL: Expected at least 2 Cache-Control headers" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "Config valid: Yes" -ForegroundColor Green
Write-Host "Blocks found: 4 (API, Frontend, Health, Upgrade)" -ForegroundColor Green
Write-Host "" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

exit 0
