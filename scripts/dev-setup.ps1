Param()
Set-StrictMode -Version Latest
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Ensure-DockerComposeUp {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host "Bringing up containers with docker compose..."
        try {
            docker compose up -d --build
        } catch {
            Write-Warning "docker compose up failed: $_"
        }
    } else {
        Write-Warning "Docker not found in PATH; skipping container startup."
    }
}

function Wait-ForPort {
    param(
        [string]$HostName = 'localhost',
        [int]$Port = 5432,
        [int]$TimeoutSec = 120
    )
    $start = [DateTime]::UtcNow
    while (([DateTime]::UtcNow - $start).TotalSeconds -lt $TimeoutSec) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $iar = $tcp.BeginConnect($HostName, $Port, $null, $null)
            if ($iar.AsyncWaitHandle.WaitOne(1000)) {
                $tcp.EndConnect($iar)
                $tcp.Close()
                Write-Host "Port ${Port} on ${HostName} is accepting connections."
                return $true
            }
        } catch {}
        Write-Host "Waiting for ${HostName}:${Port}..."
        Start-Sleep -Seconds 1
    }
    Write-Warning "Timed out waiting for ${HostName}:${Port} after ${TimeoutSec} seconds."
    return $false
}

function Run-Command($cmd) {
    Write-Host "=> $cmd"
    $proc = Start-Process -FilePath pwsh -ArgumentList "-NoProfile -Command $cmd" -NoNewWindow -PassThru -Wait
    return $proc.ExitCode
}

try {
    Write-Host "Dev setup starting..."

    Ensure-DockerComposeUp

    $ready = Wait-ForPort -HostName 'localhost' -Port 5432 -TimeoutSec 120

    Write-Host "Running database migrations and seeds (may fail if DB unavailable)..."
    # Use workspace scripts so commands run in proper folders
    try {
        npm run db:migrate
    } catch {
        Write-Warning "db:migrate failed: $_"
    }
    try {
        npm run db:seed
    } catch {
        Write-Warning "db:seed failed: $_"
    }

    Write-Host "Starting development servers (frontend + backend)..."
    $env:PORT = '5001'
    $env:VITE_API_URL = 'http://localhost:5001/api'
    npm run dev

} catch {
    Write-Error "Dev setup failed: $_"
    exit 1
}
