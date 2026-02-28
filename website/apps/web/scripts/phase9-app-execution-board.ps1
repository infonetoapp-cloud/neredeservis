param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$sprintPackagesJsonPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$workcardsJsonPath = Join-Path $appImpactDir "11_phase9_app_workcards_latest.json"
$latestMdPath = Join-Path $planDir "121_phase9_app_execution_board_latest.md"
$latestJsonPath = Join-Path $appImpactDir "18_phase9_app_execution_board_latest.json"
$timestamp = Get-Date
$snapshotSuffix = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMdPath = Join-Path $planDir ("121_phase9_app_execution_board_" + $snapshotSuffix + ".md")

function Write-FileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [string]$Encoding = "ascii",
    [int]$Attempts = 8,
    [int]$DelayMs = 250
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

if (-not (Test-Path $sprintPackagesJsonPath)) {
  throw "Eksik artefact: $sprintPackagesJsonPath"
}
if (-not (Test-Path $workcardsJsonPath)) {
  throw "Eksik artefact: $workcardsJsonPath"
}

$packagesPayload = Get-Content -Path $sprintPackagesJsonPath -Raw | ConvertFrom-Json
$workcardsPayload = Get-Content -Path $workcardsJsonPath -Raw | ConvertFrom-Json

$packageRows = @()
foreach ($pkg in $packagesPayload.packages) {
  $completion = 0
  if ($pkg.total -gt 0) {
    $completion = [Math]::Round((100.0 * $pkg.done) / $pkg.total, 1)
  }
  $packageRows += [PSCustomObject]@{
    id = [string]$pkg.id
    priority = [string]$pkg.priority
    total = [int]$pkg.total
    done = [int]$pkg.done
    open = [int]$pkg.open
    completion = $completion
  }
}

$openP0 = ($packageRows | Where-Object { $_.priority -eq "P0" } | Measure-Object -Property open -Sum).Sum
$openP1 = ($packageRows | Where-Object { $_.priority -eq "P1" } | Measure-Object -Property open -Sum).Sum
$openTotal = ($packageRows | Measure-Object -Property open -Sum).Sum
$doneTotal = ($packageRows | Measure-Object -Property done -Sum).Sum
$totalTotal = ($packageRows | Measure-Object -Property total -Sum).Sum
$completionTotal = 0
if ($totalTotal -gt 0) {
  $completionTotal = [Math]::Round((100.0 * $doneTotal) / $totalTotal, 1)
}

$status = if ($openTotal -eq 0) { "PASS" } else { "PARTIAL" }

$next4 = @()
if ($openTotal -eq 0) {
  $next4 = @(
    "phase9_closed_keep_regression_green",
    "run_manual_acceptance_before_release_window",
    "monitor_contract_drift_for_new_endpoints",
    "kickoff_next_phase_scope_with_no_admin_expansion"
  )
} else {
  $next4 = @(
    "close_app_sprint_1_parser_core",
    "close_app_sprint_2_route_liveops_parser",
    "close_app_sprint_4_acceptance_smokes",
    "rerun_phase9_closeout_and_measure"
  )
}

$topOpenItems = New-Object System.Collections.Generic.List[string]
foreach ($pkg in $packagesPayload.packages | Where-Object { $_.priority -eq "P0" }) {
  foreach ($item in $pkg.items | Where-Object { -not $_.done }) {
    if ($topOpenItems.Count -ge 12) {
      break
    }
    $topOpenItems.Add("[" + [string]$pkg.id + "] " + [string]$item.text) | Out-Null
  }
  if ($topOpenItems.Count -ge 12) {
    break
  }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 App Execution Board") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add("- Toplam ilerleme: %" + $completionTotal) | Out-Null
$lines.Add("- Toplam acik: " + $openTotal + " (P0: " + $openP0 + ", P1: " + $openP1 + ")") | Out-Null
$lines.Add("- Workcards acik: " + [int]$workcardsPayload.stats.open) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Sprint Durumu") | Out-Null
$lines.Add("| Sprint | Oncelik | Toplam | Tamam | Acik | Tamamlanma |") | Out-Null
$lines.Add("| --- | --- | --- | --- | --- | --- |") | Out-Null
foreach ($row in $packageRows) {
  $lines.Add("| " + $row.id + " | " + $row.priority + " | " + $row.total + " | " + $row.done + " | " + $row.open + " | %" + $row.completion + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Kritik Aciklar (P0 ilk 12)") | Out-Null
if ($topOpenItems.Count -eq 0) {
  $lines.Add("- Yok") | Out-Null
} else {
  foreach ($item in $topOpenItems) {
    $lines.Add("- " + $item) | Out-Null
  }
}
$lines.Add("") | Out-Null
$lines.Add("## Sonraki 4 Adim") | Out-Null
$stepIndex = 1
foreach ($step in $next4) {
  $lines.Add([string]$stepIndex + ". " + [string]$step) | Out-Null
  $stepIndex++
}
$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- Web tarafi kapali olsa bile app parser/mapping closure bitmeden final cutover onayi verilmez.") | Out-Null

$jsonPayload = [ordered]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  totals = [ordered]@{
    total = $totalTotal
    done = $doneTotal
    open = $openTotal
    completion = $completionTotal
    p0Open = $openP0
    p1Open = $openP1
    workcardsOpen = [int]$workcardsPayload.stats.open
  }
  packages = $packageRows
  next4 = $next4
}
$jsonText = ($jsonPayload | ConvertTo-Json -Depth 8)

Write-FileWithRetry -Path $latestMdPath -Value $lines
Write-FileWithRetry -Path $latestJsonPath -Value $jsonText
Write-Host ("[PHASE9-BOARD] latest-md -> " + $latestMdPath) -ForegroundColor Green
Write-Host ("[PHASE9-BOARD] latest-json -> " + $latestJsonPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotMdPath -Value $lines
  Write-Host ("[PHASE9-BOARD] snapshot -> " + $snapshotMdPath) -ForegroundColor Green
}

exit 0
