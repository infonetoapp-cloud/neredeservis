param(
  [switch]$SkipLocalGate
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = (Resolve-Path (Join-Path $scriptDir "..")).Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("85_phase5_release_readiness_" + $dateSlug + ".md")

function Invoke-Step {
  param(
    [string]$Name,
    [string]$Command
  )

  Write-Host ("[READINESS] " + $Name + " -> " + $Command) -ForegroundColor Cyan

  $outFile = [System.IO.Path]::GetTempFileName()
  $cmd = "cmd /c `"" + $Command + " > `"" + $outFile + "`" 2>&1`""
  $null = Invoke-Expression $cmd
  $exitCode = $LASTEXITCODE
  $output = @()
  if (Test-Path $outFile) {
    $output = Get-Content -Path $outFile
    Remove-Item -Path $outFile -Force -ErrorAction SilentlyContinue
  }

  return [PSCustomObject]@{
    Name = $Name
    Command = $Command
    ExitCode = $exitCode
    Status = $(if ($exitCode -eq 0) { "PASS" } else { "FAIL" })
    Output = $output
  }
}

function Find-LatestReport {
  param([string]$Pattern)

  $file = Get-ChildItem -Path $planDir -Filter $Pattern -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  return $file
}

$results = New-Object System.Collections.Generic.List[object]

if ($SkipLocalGate) {
  $results.Add([PSCustomObject]@{
    Name = "local gate"
    Command = "npm.cmd run gate:local"
    ExitCode = 0
    Status = "SKIPPED"
    Output = @("Skipped by flag: -SkipLocalGate")
  }) | Out-Null
} else {
  $results.Add((Invoke-Step -Name "local gate" -Command "cd /d `"$webDir`" && npm.cmd run gate:local")) | Out-Null
}

$results.Add((Invoke-Step -Name "vercel env audit" -Command "cd /d `"$webDir`" && npm.cmd run audit:vercel-env")) | Out-Null
$results.Add((Invoke-Step -Name "domain probe" -Command "cd /d `"$webDir`" && npm.cmd run probe:domains")) | Out-Null

$latestGate = Find-LatestReport -Pattern "82_phase5_local_gate_run_*.md"
$latestEnvAudit = Find-LatestReport -Pattern "83_vercel_env_audit_*.md"
$latestDomainProbe = Find-LatestReport -Pattern "84_domain_probe_*.md"

$failed = $results | Where-Object { $_.Status -eq "FAIL" }
$status = if ($failed.Count -eq 0) { "PASS" } else { "FAIL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 5 Release Readiness Report") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Step | Status | Exit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
foreach ($result in $results) {
  $lines.Add("| " + $result.Name + " | " + $result.Status + " | " + $result.ExitCode + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Latest Linked Reports") | Out-Null
$lines.Add("- local gate: " + $(if ($latestGate) { "website/plan/" + $latestGate.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("- vercel env audit: " + $(if ($latestEnvAudit) { "website/plan/" + $latestEnvAudit.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("- domain probe: " + $(if ($latestDomainProbe) { "website/plan/" + $latestDomainProbe.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Faz 5 Kapanisinda Manual Kalanlar") | Out-Null
$lines.Add("- STG ortaminda auth + role/mode + route/stop + live-ops + audit smoke") | Out-Null
$lines.Add("- STG env badge ve Firebase STG mapping dogrulamasi") | Out-Null
$lines.Add("- PROD CORS/cost/monitoring/Firebase mapping son kontrolleri") | Out-Null
$lines.Add("- Vercel deploy budget policy ile tek release penceresinde STG -> PROD akisinin tamamlanmasi") | Out-Null

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[READINESS] report -> " + $reportPath) -ForegroundColor Green

if ($status -eq "PASS") {
  exit 0
}
exit 1
