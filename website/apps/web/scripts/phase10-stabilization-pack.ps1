param(
  [int]$ObserveSamples = 2,
  [int]$ObserveIntervalSeconds = 2,
  [switch]$FailOnPartial
)

$ErrorActionPreference = "Stop"

if ($ObserveSamples -lt 1) {
  throw "ObserveSamples must be >= 1."
}
if ($ObserveIntervalSeconds -lt 1) {
  throw "ObserveIntervalSeconds must be >= 1."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$closeoutScript = Join-Path $scriptDir "phase10-closeout.ps1"
$observeScript = Join-Path $scriptDir "phase10-post-release-observe.ps1"

$closeoutReport = Join-Path $planDir "131_phase10_no_admin_closeout_latest.md"
$observeReport = Join-Path $planDir "132_phase10_post_release_observe_latest.md"
$latestReport = Join-Path $planDir "133_phase10_stabilization_pack_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotReport = Join-Path $planDir ("133_phase10_stabilization_pack_" + $dateSlug + ".md")

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

& $closeoutScript
& $observeScript -Samples $ObserveSamples -IntervalSeconds $ObserveIntervalSeconds

$closeoutStatus = Read-MdStatus -Path $closeoutReport
$observeStatus = Read-MdStatus -Path $observeReport
$overall = if ($closeoutStatus -eq "PASS" -and $observeStatus -eq "PASS") { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 10 Stabilization Pack") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Adim Sonuclari") | Out-Null
$lines.Add("| Adim | Durum | Kanit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
$lines.Add("| Faz 10 Closeout | " + $closeoutStatus + " | " + (Split-Path $closeoutReport -Leaf) + " |") | Out-Null
$lines.Add("| Post-Release Observe | " + $observeStatus + " | " + (Split-Path $observeReport -Leaf) + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- PARTIAL durumda yeni deploy penceresi acilmaz; once smoke+observe PASS geri alinmalidir.") | Out-Null
$lines.Add("- PASS durumda degisimler website-only commit paketine alinip release notu sabitlenir.") | Out-Null

Write-FileWithRetry -Path $latestReport -Value $lines
Write-Host ("[PHASE10-STABILIZATION] latest -> " + $latestReport) -ForegroundColor Green

Write-FileWithRetry -Path $snapshotReport -Value $lines
Write-Host ("[PHASE10-STABILIZATION] snapshot -> " + $snapshotReport) -ForegroundColor Green

if ($FailOnPartial -and $overall -ne "PASS") {
  exit 7
}
exit 0
