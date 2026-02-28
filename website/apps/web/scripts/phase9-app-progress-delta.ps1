param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$executionBoardJsonPath = Join-Path $appImpactDir "18_phase9_app_execution_board_latest.json"
$workcardsJsonPath = Join-Path $appImpactDir "11_phase9_app_workcards_latest.json"
$batchJsonPath = Join-Path $appImpactDir "20_phase9_app_batch_plan_latest.json"
$latestMdPath = Join-Path $planDir "127_phase9_app_progress_delta_latest.md"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMdPath = Join-Path $planDir ("127_phase9_app_progress_delta_" + $dateSlug + ".md")

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

if (-not (Test-Path $executionBoardJsonPath)) { throw "Eksik artefact: $executionBoardJsonPath" }
if (-not (Test-Path $workcardsJsonPath)) { throw "Eksik artefact: $workcardsJsonPath" }
if (-not (Test-Path $batchJsonPath)) { throw "Eksik artefact: $batchJsonPath" }

$execution = Get-Content -Path $executionBoardJsonPath -Raw | ConvertFrom-Json
$workcards = Get-Content -Path $workcardsJsonPath -Raw | ConvertFrom-Json
$batch = Get-Content -Path $batchJsonPath -Raw | ConvertFrom-Json

$openTotal = [int]$execution.totals.open
$p0Open = [int]$execution.totals.p0Open
$p1Open = [int]$execution.totals.p1Open
$completion = [double]$execution.totals.completion
$workcardsOpen = [int]$workcards.stats.open
$batchCount = [int]$batch.batchCount

$goNoGo = if ($p0Open -eq 0 -and $workcardsOpen -eq 0) { "GO" } else { "NO-GO" }
$riskLevel = if ($p0Open -ge 20) { "YUKSEK" } elseif ($p0Open -ge 8) { "ORTA" } else { "DUSUK" }
$status = if ($openTotal -eq 0 -and $workcardsOpen -eq 0) { "PASS" } else { "PARTIAL" }

$next4 = @()
if ($execution.next4) {
  $next4 = @($execution.next4 | Select-Object -First 4)
}
if ($next4.Count -eq 0) {
  if ($status -eq "PASS") {
    $next4 = @(
      "phase9_closed_keep_regression_green",
      "run_manual_acceptance_before_release_window",
      "monitor_contract_drift_and_update_register",
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
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 App Progress Delta") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add("| Metrik | Deger |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
$lines.Add("| GO/NO-GO | " + $goNoGo + " |") | Out-Null
$lines.Add("| Risk seviyesi | " + $riskLevel + " |") | Out-Null
$lines.Add("| Toplam acik | " + $openTotal + " |") | Out-Null
$lines.Add("| P0 acik | " + $p0Open + " |") | Out-Null
$lines.Add("| P1 acik | " + $p1Open + " |") | Out-Null
$lines.Add("| Workcards acik | " + $workcardsOpen + " |") | Out-Null
$lines.Add("| Tamamlanma | %" + $completion + " |") | Out-Null
$lines.Add("| Batch sayisi | " + $batchCount + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Sonraki 4 Adim") | Out-Null
$step = 1
foreach ($item in $next4) {
  $lines.Add([string]$step + ". " + [string]$item) | Out-Null
  $step++
}
$lines.Add("") | Out-Null
$lines.Add("## Operasyon Kurali") | Out-Null
$lines.Add("- P0 acik > 0 oldugu surece final cutover GO verilmez.") | Out-Null
$lines.Add("- Her batch kapanisinda: `workcards-json -> board -> closeout` zinciri tekrar kosulur.") | Out-Null
$lines.Add("- App checklist 07 maddeleri [x] olmadan closeout PASS'e cekilmez.") | Out-Null

Write-FileWithRetry -Path $latestMdPath -Value $lines
Write-Host ("[PHASE9-PROGRESS-DELTA] latest -> " + $latestMdPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotMdPath -Value $lines
  Write-Host ("[PHASE9-PROGRESS-DELTA] snapshot -> " + $snapshotMdPath) -ForegroundColor Green
}

exit 0
