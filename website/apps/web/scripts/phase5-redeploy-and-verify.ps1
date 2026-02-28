param(
  [string]$Deployment = "nsv-web-dev.vercel.app",
  [string]$Scope = "infonetoapp-clouds-projects",
  [switch]$NoWait
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("88_phase5_redeploy_and_verify_" + $dateSlug + ".md")

function Run-CmdCapture {
  param([string]$Cmd)

  $tmp = [System.IO.Path]::GetTempFileName()
  cmd /c ($Cmd + " > """ + $tmp + """ 2>&1")
  $exitCode = $LASTEXITCODE
  $lines = @()
  if (Test-Path $tmp) {
    $lines = Get-Content -Path $tmp
    Remove-Item -Path $tmp -Force -ErrorAction SilentlyContinue
  }
  return [PSCustomObject]@{
    ExitCode = $exitCode
    Output = $lines
  }
}

$redeployCmd = "cd /d `"$scriptDir\..`" && npx.cmd vercel redeploy " + $Deployment + " --target production --scope " + $Scope
if ($NoWait) {
  $redeployCmd += " --no-wait"
}

Write-Host ("[REDEPLOY] " + $redeployCmd) -ForegroundColor Cyan
$redeploy = Run-CmdCapture -Cmd $redeployCmd

$redeployStatus = "PASS"
$redeployNote = "ok"

$outText = ($redeploy.Output -join "`n")
if ($redeploy.ExitCode -ne 0) {
  $redeployStatus = "FAIL"
  $redeployNote = "command failed"
}
if ($outText -match "api-deployments-free-per-day") {
  $redeployStatus = "BLOCKED"
  $redeployNote = "Vercel free daily deploy limit"
}

$smokeCmd = "cd /d `"$scriptDir\..`" && powershell -ExecutionPolicy Bypass -File .\scripts\phase5-manual-smoke-probe.ps1 -SkipStg"
Write-Host ("[VERIFY] " + $smokeCmd) -ForegroundColor Cyan
$smoke = Run-CmdCapture -Cmd $smokeCmd
$smokeStatus = if ($smoke.ExitCode -eq 0) { "PASS" } else { "FAIL" }

$latestSmoke = Get-ChildItem -Path $planDir -Filter "87_phase5_manual_smoke_probe_*.md" -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if ($latestSmoke) {
  try {
    $smokeLines = Get-Content -Path $latestSmoke.FullName
    $statusLine = $smokeLines | Where-Object { $_ -match "^Durum:\s+" } | Select-Object -First 1
    if ($statusLine -match "Durum:\s+PARTIAL") { $smokeStatus = "PARTIAL" }
    elseif ($statusLine -match "Durum:\s+FAIL") { $smokeStatus = "FAIL" }
    elseif ($statusLine -match "Durum:\s+PASS") { $smokeStatus = "PASS" }
  } catch {
    # keep fallback based on exit code
  }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 5 Redeploy And Verify Report") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Step | Status | Note |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
$lines.Add("| production redeploy | " + $redeployStatus + " | " + $redeployNote + " |") | Out-Null
$lines.Add("| prod smoke probe (skip stg) | " + $smokeStatus + " | see linked smoke report |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Linked Smoke Report") | Out-Null
$lines.Add("- " + $(if ($latestSmoke) { "website/plan/" + $latestSmoke.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Redeploy Raw Output (first 40 lines)") | Out-Null
$preview = $redeploy.Output | Select-Object -First 40
if ($preview.Count -eq 0) {
  $lines.Add("- no output") | Out-Null
} else {
  foreach ($line in $preview) {
    $safe = $line.Replace("|", "\|")
    $lines.Add("- " + $safe) | Out-Null
  }
}

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[REDEPLOY] report -> " + $reportPath) -ForegroundColor Green

if ($redeployStatus -eq "PASS" -and $smokeStatus -eq "PASS") {
  exit 0
}
exit 0
