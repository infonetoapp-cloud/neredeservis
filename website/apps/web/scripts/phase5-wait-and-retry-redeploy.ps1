param(
  [int]$MaxWaitMinutes = 25
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

function Get-LatestRedeployReport {
  return Get-ChildItem -Path $planDir -Filter "88_phase5_redeploy_and_verify_*.md" -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

$latest = Get-LatestRedeployReport
if (-not $latest) {
  Write-Host "[WAIT-RETRY] Latest 88 report BULUNAMADI. Once redeploy:phase5:verify calistir." -ForegroundColor Yellow
  exit 1
}

$content = Get-Content -Path $latest.FullName
$retryLine = $content | Where-Object { $_ -match "try again in [0-9]+ minutes" } | Select-Object -First 1
if (-not $retryLine) {
  Write-Host "[WAIT-RETRY] Retry penceresi raporda bulunamadi, dogrudan redeploy denenecek." -ForegroundColor Yellow
  $minutes = 0
} else {
  $minutes = [int]([regex]::Match($retryLine, "try again in ([0-9]+) minutes").Groups[1].Value)
}

if ($minutes -gt $MaxWaitMinutes) {
  Write-Host ("[WAIT-RETRY] Bekleme suresi cok yuksek: " + $minutes + " dk (max " + $MaxWaitMinutes + " dk).") -ForegroundColor Red
  exit 1
}

if ($minutes -gt 0) {
  Write-Host ("[WAIT-RETRY] " + $minutes + " dakika bekleniyor...") -ForegroundColor Cyan
  Start-Sleep -Seconds ($minutes * 60 + 20)
}

Write-Host "[WAIT-RETRY] Tekrar deneme: npm run redeploy:phase5:verify" -ForegroundColor Cyan
Push-Location (Join-Path $scriptDir "..")
try {
  npm run redeploy:phase5:verify
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location
}

exit $exitCode
