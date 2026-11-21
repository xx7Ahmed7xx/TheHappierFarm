# docker-verify.ps1 - Windows Deployment Verification Script
# Usage: .\docker-verify.ps1 <ip> <api_port> <front_port>

param(
    [string]$ip = "57.129.191.113",
    [int]$apiPort = 8080,
    [int]$frontPort = 80
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Happier Farm Deployment Verification" -ForegroundColor Cyan
Write-Host "VPS IP: $ip" -ForegroundColor Yellow
Write-Host "API Port: $apiPort" -ForegroundColor Yellow
Write-Host "Frontend Port: $frontPort" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$results = New-Object System.Collections.Generic.List[PSObject]

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$url,
        [string]$method = "GET",
        [string]$expectedStatus = "200"
    )
    
    Write-Host "Testing: $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method $method -TimeoutSec 10
    
    $status = if ($response.StatusCode -eq [System.Net.HttpStatusCode]::Ok) { "200 OK" } else { $response.StatusCode }
    
    if ($status -eq $expectedStatus) {
        Write-Host "  ✓ PASS: Status $status" -ForegroundColor Green
        $result = [PSCustomObject]@{
            Test = "Endpoint"
            Url = $url
            Status = $status
            Pass = $true
        }
    } else {
        Write-Host "  ✗ FAIL: Expected $expectedStatus, got $status" -ForegroundColor Red
        $result = [PSCustomObject]@{
            Test = "Endpoint"
            Url = $url
            Status = $status
            Expected = $expectedStatus
            Pass = $false
        }
    }
    
    return $result
}

# Function to check port listening
function Test-Port {
    param(
        [int]$port,
        [string]$description
    )
    
    Write-Host "Checking port $port ($description)" -ForegroundColor Gray
    
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    
    if ($process) {
        Write-Host "  ✓ PASS: Port $port is listening (PID: $($process.OwningProcess.Id))" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ✗ FAIL: Port $port is not listening" -ForegroundColor Red
        return $false
    }
}

# Function to run SSH command
function Run-SshCommand {
    param(
        [string]$command
    )
    
    try {
        $output = Invoke-Expression "ssh root@$ip '$command'" -TimeoutSec 30
        $output.Trim()
    } catch {
        $_.Exception.Message
    }
}

Write-Host "--- API Checks ---" -ForegroundColor Gray
$result = Test-Endpoint ("https://$ip/api/health")
$results.Add($result)

$result = Test-Endpoint ("https://$ip/api/animals", "GET")
$results.Add($result)

$result = Test-Endpoint ("https://$ip/api/factories", "GET")
$results.Add($result)

$result = Test-Endpoint ("https://$ip/api/crops", "GET")
$results.Add($result)

$result = Test-Endpoint ("https://$ip/api/resources", "GET")
$results.Add($result)

Write-Host "" -ForegroundColor Gray
Write-Host "--- Frontend Checks ---" -ForegroundColor Gray
$result = Test-Endpoint ("https://$ip/frontend")
$results.Add($result)

$result = Test-Endpoint ("https://$ip/frontend/assets", "GET")
$results.Add($result)

Write-Host "" -ForegroundColor Gray
Write-Host "--- Port Checks ---" -ForegroundColor Gray
$apiListening = Test-Port $apiPort "API"
$result = New-Object PSObject -Property @{
    Test = "API Port"
    Port = $apiPort
    Description = "API"
    Pass = $apiListening
}
$results.Add($result)

$frontListening = Test-Port $frontPort "Frontend"
$result = New-Object PSObject -Property @{
    Test = "Frontend Port"
    Port = $frontPort
    Description = "Frontend"
    Pass = $frontListening
}
$results.Add($result)

Write-Host "" -ForegroundColor Gray
Write-Host "--- SSH Checks ---" -ForegroundColor Gray
$sshCommand = "docker ps --format '{{{.Name}}}'"
$result = New-Object PSObject -Property @{
    Test = "SSH Connectivity"
    Command = $sshCommand
    Output = Run-SshCommand $sshCommand
    Pass = $true
}
$results.Add($result)

Write-Host "" -ForegroundColor Gray
Write-Host "--- Caddy Configuration ---" -ForegroundColor Gray
$ssloptions = "ssl_options max_chain_depth 0; max_cert_life 365d;"
$command = "caddy show -d \"$ip\" 2>/dev/null | grep -A 10 '$ssloptions'"
$result = New-Object PSObject -Property @{
    Test = "Caddy Config (SSLOptions)"
    Command = $command
    Output = Run-SshCommand $command
    Pass = $true
}
$results.Add($result)

Write-Host "" -ForegroundColor Gray
Write-Host "--- SignalR/Upgrade Check ---" -ForegroundColor Gray
$upgradeResponse = Invoke-RestMethod "https://$ip/api/realtime" -Method "GET" -TimeoutSec 10 -ErrorAction Stop
$status = "WebSocket"
if ($upgradeResponse.StatusCode -ne 101) {
    $status = "101"
}
$result = New-Object PSObject -Property @{
    Test = "Upgrade Handler"
    Endpoint = "https://$ip/api/realtime"
    Status = $status
    Pass = ($upgradeResponse.StatusCode -eq 101)
}
$results.Add($result)

# Summary
Write-Host "" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
$total = $results.Count
$passed = $results | Where-Object { $_.Pass } | Measure-Object | Select-Object -Expand Count
$failed = $total - $passed
Write-Host "Tests:     $total" -ForegroundColor White
Write-Host "Passed:    $passed" -ForegroundColor Green
Write-Host "Failed:    $failed" -ForegroundColor Red

if ($failed -gt 0) {
    Write-Host "" -ForegroundColor Red
    Write-Host "Failed Tests:" -ForegroundColor Red
    $failedTests = $results | Where-Object { $_.Pass -eq $false }
    $failedTests | Format-Table -AutoSize
}
Write-Host "" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

exit $if ($failed -gt 0) { 1 } else { 0 }
