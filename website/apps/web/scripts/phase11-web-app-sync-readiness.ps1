param(
  [switch]$FailOnPending
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$registerPath = Join-Path $appImpactDir "00_web_to_app_change_register.md"
$phase9CloseoutPath = Join-Path $planDir "106_phase9_closeout_latest.md"
$phase10CloseoutPath = Join-Path $planDir "131_phase10_no_admin_closeout_latest.md"
$phase11CloseoutPath = Join-Path $planDir "137_phase11_closeout_latest.md"

$latestReport = Join-Path $planDir "138_phase11_web_app_sync_readiness_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotReport = Join-Path $planDir ("138_phase11_web_app_sync_readiness_" + $dateSlug + ".md")

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

if (-not (Test-Path $registerPath)) {
  throw "Register path not found: $registerPath"
}

$registerRaw = Get-Content -Path $registerPath -Raw
$statusMatches = [regex]::Matches(
  $registerRaw,
  '(?m)^-\s*(?:`Status`|Status)\s*:\s*`?([a-z_]+)`?\s*$'
)

$statusCounts = @{}
foreach ($match in $statusMatches) {
  $value = $match.Groups[1].Value
  if (-not $statusCounts.ContainsKey($value)) {
    $statusCounts[$value] = 0
  }
  $statusCounts[$value]++
}

$pendingStatuses = @(
  "web_done_app_pending",
  "web_pending_app_pending",
  "app_pending"
)
$deferredStatuses = @(
  "web_done_app_deferred"
)

$pendingTotal = 0
foreach ($name in $pendingStatuses) {
  if ($statusCounts.ContainsKey($name)) {
    $pendingTotal += $statusCounts[$name]
  }
}

$deferredTotal = 0
foreach ($name in $deferredStatuses) {
  if ($statusCounts.ContainsKey($name)) {
    $deferredTotal += $statusCounts[$name]
  }
}

$triagedTotal = if ($statusCounts.ContainsKey("triaged")) { $statusCounts["triaged"] } else { 0 }

$phase9Status = Read-MdStatus -Path $phase9CloseoutPath
$phase10Status = Read-MdStatus -Path $phase10CloseoutPath
$phase11Status = Read-MdStatus -Path $phase11CloseoutPath

$overall = if (
  $phase9Status -eq "PASS" -and
  $phase10Status -eq "PASS" -and
  $phase11Status -eq "PASS" -and
  $pendingTotal -eq 0 -and
  $triagedTotal -eq 0
) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 11 Web-App Sync Readiness") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Core Gate Durumlari") | Out-Null
$lines.Add("| Gate | Durum | Kanit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
$lines.Add("| Faz 9 Closeout | " + $phase9Status + " | " + (Split-Path $phase9CloseoutPath -Leaf) + " |") | Out-Null
$lines.Add("| Faz 10 Closeout | " + $phase10Status + " | " + (Split-Path $phase10CloseoutPath -Leaf) + " |") | Out-Null
$lines.Add("| Faz 11 Closeout | " + $phase11Status + " | " + (Split-Path $phase11CloseoutPath -Leaf) + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Register Ozet") | Out-Null
$lines.Add("| Metrik | Deger |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
$lines.Add("| Toplam kayit | " + $statusMatches.Count + " |") | Out-Null
$lines.Add("| Pending toplam | " + $pendingTotal + " |") | Out-Null
$lines.Add("| Triaged toplam | " + $triagedTotal + " |") | Out-Null
$lines.Add("| Deferred toplam | " + $deferredTotal + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Status Dagilimi") | Out-Null
$lines.Add("| Status | Adet |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
foreach ($entry in ($statusCounts.GetEnumerator() | Sort-Object Name)) {
  $lines.Add("| " + $entry.Key + " | " + $entry.Value + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Not") | Out-Null
$lines.Add("- Pending + Triaged toplam 0 oldugunda web-app sync tam kapanis (PASS) verilir.") | Out-Null
$lines.Add("- Deferred kayitlar opsiyonel backlog kabul edilir; release blocker degildir.") | Out-Null

Write-FileWithRetry -Path $latestReport -Value $lines
Write-Host ("[PHASE11-SYNC] latest -> " + $latestReport) -ForegroundColor Green

Write-FileWithRetry -Path $snapshotReport -Value $lines
Write-Host ("[PHASE11-SYNC] snapshot -> " + $snapshotReport) -ForegroundColor Green

if ($FailOnPending -and $pendingTotal -gt 0) {
  exit 7
}
exit 0
