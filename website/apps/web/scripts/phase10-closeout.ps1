param(
  [switch]$FailOnPartial,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$readinessScript = Join-Path $scriptDir "phase10-no-admin-readiness.ps1"
$manualReleaseScript = Join-Path $scriptDir "phase10-manual-release-window.ps1"

$readinessReport = Join-Path $planDir "129_phase10_no_admin_readiness_latest.md"
$manualReleaseReport = Join-Path $planDir "130_phase10_manual_release_window_latest.md"
$latestReport = Join-Path $planDir "131_phase10_no_admin_closeout_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotReport = Join-Path $planDir ("131_phase10_no_admin_closeout_" + $dateSlug + ".md")

function Write-FileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [string]$Encoding = "ascii",
    [int]$Attempts = 30,
    [int]$DelayMs = 600
  )
  for ($i = 1; $i -le $Attempts; $i++) {
    try {
      Set-Content -Path $Path -Value $Value -Encoding $Encoding
      return
    } catch {
      if ($i -eq $Attempts) {
        throw
      }
      Start-Sleep -Milliseconds $DelayMs
    }
  }
}

function Read-MdStatus {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return "MISSING"
  }
  $raw = Get-Content -Path $Path -Raw
  $match = [regex]::Match($raw, "(?m)^Durum:\s*([A-Z_]+)")
  if (-not $match.Success) {
    return "UNKNOWN"
  }
  return $match.Groups[1].Value
}

& $readinessScript
& $manualReleaseScript

$readinessStatus = Read-MdStatus -Path $readinessReport
$manualReleaseStatus = Read-MdStatus -Path $manualReleaseReport

$overall = if ($readinessStatus -eq "PASS" -and $manualReleaseStatus -eq "PASS") { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 10 No-Admin Closeout") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Adim Sonuclari") | Out-Null
$lines.Add("| Adim | Durum | Kanit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
$lines.Add("| No-Admin Readiness | " + $readinessStatus + " | " + (Split-Path $readinessReport -Leaf) + " |") | Out-Null
$lines.Add("| Manual Release Window Pack | " + $manualReleaseStatus + " | " + (Split-Path $manualReleaseReport -Leaf) + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- PARTIAL durumunda deploy penceresi acilmaz.") | Out-Null
$lines.Add("- PASS durumunda deploy butce politikasina uygun tek pencere release uygulanir.") | Out-Null

Write-FileWithRetry -Path $latestReport -Value $lines
Write-Host ("[PHASE10-CLOSEOUT] latest -> " + $latestReport) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotReport -Value $lines
  Write-Host ("[PHASE10-CLOSEOUT] snapshot -> " + $snapshotReport) -ForegroundColor Green
}

if ($FailOnPartial -and $overall -ne "PASS") {
  exit 6
}
exit 0
