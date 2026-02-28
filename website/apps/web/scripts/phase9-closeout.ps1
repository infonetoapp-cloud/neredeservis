param(
  [switch]$FailOnPartial,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$handoffScript = Join-Path $scriptDir "phase9-app-parity-handoff.ps1"
$packetScript = Join-Path $scriptDir "phase9-parser-contract-packet.ps1"
$contractJsonScript = Join-Path $scriptDir "phase9-contract-json-export.ps1"
$workcardsJsonScript = Join-Path $scriptDir "phase9-workcards-json-export.ps1"
$executionBoardScript = Join-Path $scriptDir "phase9-app-execution-board.ps1"
$sprintPackagesScript = Join-Path $scriptDir "phase9-app-sprint-packages.ps1"
$batchPlanScript = Join-Path $scriptDir "phase9-app-batch-plan.ps1"
$issueCardsScript = Join-Path $scriptDir "phase9-app-issue-cards.ps1"
$progressDeltaScript = Join-Path $scriptDir "phase9-app-progress-delta.ps1"
$implementationPackScript = Join-Path $scriptDir "phase9-app-implementation-pack.ps1"
$dailyCheckpointScript = Join-Path $scriptDir "phase9-app-daily-checkpoint.ps1"
$manualAcceptancePackScript = Join-Path $scriptDir "phase9-manual-acceptance-pack.ps1"
$kickoffPromptScript = Join-Path $scriptDir "phase9-app-kickoff-prompt.ps1"
$sprint1PackScript = Join-Path $scriptDir "phase9-app-sprint1-execution-pack.ps1"
$sprint2PackScript = Join-Path $scriptDir "phase9-app-sprint2-execution-pack.ps1"
$sprint3PackScript = Join-Path $scriptDir "phase9-app-sprint3-execution-pack.ps1"
$sprint4PackScript = Join-Path $scriptDir "phase9-app-sprint4-execution-pack.ps1"
$readinessScript = Join-Path $scriptDir "phase9-cutover-core-readiness.ps1"
$webReadinessScript = Join-Path $scriptDir "phase9-web-only-readiness.ps1"
$workcardsScript = Join-Path $scriptDir "phase9-app-workcards.ps1"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestReportPath = Join-Path $planDir "106_phase9_closeout_latest.md"
$snapshotReportPath = Join-Path $planDir ("106_phase9_closeout_" + $dateSlug + ".md")

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

& $handoffScript
& $packetScript
& $contractJsonScript
& $workcardsJsonScript
& $sprintPackagesScript
& $batchPlanScript
& $issueCardsScript
& $progressDeltaScript
& $executionBoardScript
& $implementationPackScript
& $dailyCheckpointScript
& $manualAcceptancePackScript
& $kickoffPromptScript
& $sprint1PackScript
& $sprint2PackScript
& $sprint3PackScript
& $sprint4PackScript
& $readinessScript
& $webReadinessScript
& $workcardsScript

$latestHandoff = Join-Path $planDir "103_phase9_app_parity_handoff_latest.md"
$latestPacket = Join-Path $planDir "105_phase9_parser_contract_packet_latest.md"
$latestReadiness = Join-Path $planDir "104_phase9_cutover_core_readiness_latest.md"
$latestWebReadiness = Join-Path $planDir "109_phase9_web_only_readiness_latest.md"
$latestWorkcards = Join-Path $planDir "107_phase9_app_workcards_latest.md"
$latestContractJson = Join-Path $appImpactDir "10_phase9_contract_packet_latest.json"
$latestWorkcardsJson = Join-Path $appImpactDir "11_phase9_app_workcards_latest.json"
$latestExecutionBoardJson = Join-Path $appImpactDir "18_phase9_app_execution_board_latest.json"
$latestExecutionBoard = Join-Path $planDir "121_phase9_app_execution_board_latest.md"
$latestSprintPackages = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$latestBatchPlanJson = Join-Path $appImpactDir "20_phase9_app_batch_plan_latest.json"
$latestBatchPlan = Join-Path $planDir "125_phase9_app_batch_plan_latest.md"
$latestIssueCardsJson = Join-Path $appImpactDir "21_phase9_app_issue_cards_latest.json"
$latestIssueCards = Join-Path $planDir "126_phase9_app_issue_cards_latest.md"
$latestProgressDelta = Join-Path $planDir "127_phase9_app_progress_delta_latest.md"
$latestImplementationPack = Join-Path $planDir "123_phase9_app_implementation_pack_latest.md"
$latestDailyCheckpoint = Join-Path $planDir "124_phase9_app_daily_checkpoint_latest.md"
$latestManualAcceptancePack = Join-Path $planDir "122_phase9_manual_acceptance_pack_latest.md"
$latestKickoffPrompt = Join-Path $planDir "113_phase9_app_kickoff_prompt_latest.md"
$latestSprint1Runbook = Join-Path $planDir "114_phase9_app_sprint1_execution_latest.md"
$latestSprint1Template = Join-Path $appImpactDir "14_phase9_app_sprint1_smoke_template_latest.json"
$latestSprint2Runbook = Join-Path $planDir "116_phase9_app_sprint2_execution_latest.md"
$latestSprint2Template = Join-Path $appImpactDir "15_phase9_app_sprint2_smoke_template_latest.json"
$latestSprint3Runbook = Join-Path $planDir "118_phase9_app_sprint3_execution_latest.md"
$latestSprint3Template = Join-Path $appImpactDir "16_phase9_app_sprint3_smoke_template_latest.json"
$latestSprint4Runbook = Join-Path $planDir "120_phase9_app_sprint4_execution_latest.md"
$latestSprint4Template = Join-Path $appImpactDir "17_phase9_app_sprint4_smoke_template_latest.json"

function Read-ReportStatus {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return "MISSING"
  }
  foreach ($line in Get-Content -Path $Path) {
    if ($line -match "^Durum:\s*(.+)$") {
      return $Matches[1].Trim()
    }
  }
  return "UNKNOWN"
}

$handoffStatus = Read-ReportStatus -Path $latestHandoff
$packetStatus = Read-ReportStatus -Path $latestPacket
$readinessStatus = Read-ReportStatus -Path $latestReadiness
$webReadinessStatus = Read-ReportStatus -Path $latestWebReadiness
$workcardsStatus = Read-ReportStatus -Path $latestWorkcards
$contractJsonStatus = "UNKNOWN"
if (Test-Path $latestContractJson) {
  try {
    $contractJsonPayload = Get-Content -Path $latestContractJson -Raw | ConvertFrom-Json
    if ($null -ne $contractJsonPayload.status) {
      $contractJsonStatus = [string]$contractJsonPayload.status
    }
  } catch {
    $contractJsonStatus = "UNKNOWN"
  }
}
$workcardsJsonStatus = "UNKNOWN"
if (Test-Path $latestWorkcardsJson) {
  try {
    $workcardsJsonPayload = Get-Content -Path $latestWorkcardsJson -Raw | ConvertFrom-Json
    if ($null -ne $workcardsJsonPayload.status) {
      $workcardsJsonStatus = [string]$workcardsJsonPayload.status
    }
  } catch {
    $workcardsJsonStatus = "UNKNOWN"
  }
}
$executionBoardJsonStatus = "UNKNOWN"
if (Test-Path $latestExecutionBoardJson) {
  try {
    $executionBoardJsonPayload = Get-Content -Path $latestExecutionBoardJson -Raw | ConvertFrom-Json
    if ($null -ne $executionBoardJsonPayload.status) {
      $executionBoardJsonStatus = [string]$executionBoardJsonPayload.status
    }
  } catch {
    $executionBoardJsonStatus = "UNKNOWN"
  }
}
$executionBoardStatus = Read-ReportStatus -Path $latestExecutionBoard
$sprintPackagesStatus = "UNKNOWN"
if (Test-Path $latestSprintPackages) {
  try {
    $sprintPackagesPayload = Get-Content -Path $latestSprintPackages -Raw | ConvertFrom-Json
    if ($null -ne $sprintPackagesPayload.status) {
      $sprintPackagesStatus = [string]$sprintPackagesPayload.status
    }
  } catch {
    $sprintPackagesStatus = "UNKNOWN"
  }
}
$batchPlanJsonStatus = "UNKNOWN"
if (Test-Path $latestBatchPlanJson) {
  try {
    $batchPlanJsonPayload = Get-Content -Path $latestBatchPlanJson -Raw | ConvertFrom-Json
    if ($null -ne $batchPlanJsonPayload.status) {
      $batchPlanJsonStatus = [string]$batchPlanJsonPayload.status
    }
  } catch {
    $batchPlanJsonStatus = "UNKNOWN"
  }
}
$batchPlanStatus = Read-ReportStatus -Path $latestBatchPlan
$issueCardsJsonStatus = "UNKNOWN"
if (Test-Path $latestIssueCardsJson) {
  try {
    $issueCardsJsonPayload = Get-Content -Path $latestIssueCardsJson -Raw | ConvertFrom-Json
    if ($null -ne $issueCardsJsonPayload.status) {
      $issueCardsJsonStatus = [string]$issueCardsJsonPayload.status
    }
  } catch {
    $issueCardsJsonStatus = "UNKNOWN"
  }
}
$issueCardsStatus = Read-ReportStatus -Path $latestIssueCards
$progressDeltaStatus = Read-ReportStatus -Path $latestProgressDelta
$implementationPackStatus = Read-ReportStatus -Path $latestImplementationPack
$dailyCheckpointStatus = Read-ReportStatus -Path $latestDailyCheckpoint
$manualAcceptancePackStatus = Read-ReportStatus -Path $latestManualAcceptancePack
$kickoffPromptStatus = if (Test-Path $latestKickoffPrompt) { "PASS" } else { "MISSING" }
$sprint1PackStatus = if ((Test-Path $latestSprint1Runbook) -and (Test-Path $latestSprint1Template)) { "PASS" } else { "MISSING" }
$sprint2PackStatus = if ((Test-Path $latestSprint2Runbook) -and (Test-Path $latestSprint2Template)) { "PASS" } else { "MISSING" }
$sprint3PackStatus = if ((Test-Path $latestSprint3Runbook) -and (Test-Path $latestSprint3Template)) { "PASS" } else { "MISSING" }
$sprint4PackStatus = if ((Test-Path $latestSprint4Runbook) -and (Test-Path $latestSprint4Template)) { "PASS" } else { "MISSING" }

$overallStatus = if (
  $handoffStatus -eq "PASS" -and
  $packetStatus -eq "PASS" -and
  $contractJsonStatus -eq "PASS" -and
  $workcardsJsonStatus -eq "PASS" -and
  $executionBoardJsonStatus -eq "PASS" -and
  $executionBoardStatus -eq "PASS" -and
  $sprintPackagesStatus -eq "PASS" -and
  $batchPlanJsonStatus -eq "PASS" -and
  $batchPlanStatus -eq "PASS" -and
  $issueCardsJsonStatus -eq "PASS" -and
  $issueCardsStatus -eq "PASS" -and
  $progressDeltaStatus -eq "PASS" -and
  $implementationPackStatus -eq "PASS" -and
  $dailyCheckpointStatus -eq "PASS" -and
  $manualAcceptancePackStatus -eq "PASS" -and
  $kickoffPromptStatus -eq "PASS" -and
  $sprint1PackStatus -eq "PASS" -and
  $sprint2PackStatus -eq "PASS" -and
  $sprint3PackStatus -eq "PASS" -and
  $sprint4PackStatus -eq "PASS" -and
  $readinessStatus -eq "PASS" -and
  $workcardsStatus -eq "PASS"
) {
  "PASS"
} else {
  "PARTIAL"
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 Closeout") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overallStatus) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Adim Sonuclari") | Out-Null
$lines.Add("| Adim | Durum | Kanit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
$lines.Add("| Handoff | " + $handoffStatus + " | " + (Split-Path $latestHandoff -Leaf) + " |") | Out-Null
$lines.Add("| Parser Packet | " + $packetStatus + " | " + (Split-Path $latestPacket -Leaf) + " |") | Out-Null
$lines.Add("| Contract JSON | " + $contractJsonStatus + " | " + (Split-Path $latestContractJson -Leaf) + " |") | Out-Null
$lines.Add("| Workcards JSON | " + $workcardsJsonStatus + " | " + (Split-Path $latestWorkcardsJson -Leaf) + " |") | Out-Null
$lines.Add("| Execution Board JSON | " + $executionBoardJsonStatus + " | " + (Split-Path $latestExecutionBoardJson -Leaf) + " |") | Out-Null
$lines.Add("| Execution Board | " + $executionBoardStatus + " | " + (Split-Path $latestExecutionBoard -Leaf) + " |") | Out-Null
$lines.Add("| Sprint Packages JSON | " + $sprintPackagesStatus + " | " + (Split-Path $latestSprintPackages -Leaf) + " |") | Out-Null
$lines.Add("| App Batch Plan JSON | " + $batchPlanJsonStatus + " | " + (Split-Path $latestBatchPlanJson -Leaf) + " |") | Out-Null
$lines.Add("| App Batch Plan | " + $batchPlanStatus + " | " + (Split-Path $latestBatchPlan -Leaf) + " |") | Out-Null
$lines.Add("| App Issue Cards JSON | " + $issueCardsJsonStatus + " | " + (Split-Path $latestIssueCardsJson -Leaf) + " |") | Out-Null
$lines.Add("| App Issue Cards | " + $issueCardsStatus + " | " + (Split-Path $latestIssueCards -Leaf) + " |") | Out-Null
$lines.Add("| App Progress Delta | " + $progressDeltaStatus + " | " + (Split-Path $latestProgressDelta -Leaf) + " |") | Out-Null
$lines.Add("| App Implementation Pack | " + $implementationPackStatus + " | " + (Split-Path $latestImplementationPack -Leaf) + " |") | Out-Null
$lines.Add("| App Daily Checkpoint | " + $dailyCheckpointStatus + " | " + (Split-Path $latestDailyCheckpoint -Leaf) + " |") | Out-Null
$lines.Add("| Manual Acceptance Pack | " + $manualAcceptancePackStatus + " | " + (Split-Path $latestManualAcceptancePack -Leaf) + " |") | Out-Null
$lines.Add("| App Kickoff Prompt | " + $kickoffPromptStatus + " | " + (Split-Path $latestKickoffPrompt -Leaf) + " |") | Out-Null
$lines.Add("| Sprint1 Execution Pack | " + $sprint1PackStatus + " | " + (Split-Path $latestSprint1Runbook -Leaf) + " + " + (Split-Path $latestSprint1Template -Leaf) + " |") | Out-Null
$lines.Add("| Sprint2 Execution Pack | " + $sprint2PackStatus + " | " + (Split-Path $latestSprint2Runbook -Leaf) + " + " + (Split-Path $latestSprint2Template -Leaf) + " |") | Out-Null
$lines.Add("| Sprint3 Execution Pack | " + $sprint3PackStatus + " | " + (Split-Path $latestSprint3Runbook -Leaf) + " + " + (Split-Path $latestSprint3Template -Leaf) + " |") | Out-Null
$lines.Add("| Sprint4 Execution Pack | " + $sprint4PackStatus + " | " + (Split-Path $latestSprint4Runbook -Leaf) + " + " + (Split-Path $latestSprint4Template -Leaf) + " |") | Out-Null
$lines.Add("| Cutover Readiness | " + $readinessStatus + " | " + (Split-Path $latestReadiness -Leaf) + " |") | Out-Null
$lines.Add("| Web-Only Readiness | " + $webReadinessStatus + " | " + (Split-Path $latestWebReadiness -Leaf) + " |") | Out-Null
$lines.Add("| App Workcards | " + $workcardsStatus + " | " + (Split-Path $latestWorkcards -Leaf) + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- `PARTIAL` durumunda app parser/mapping closure tamamlanmadan final cutover onayi verilmez.") | Out-Null
$lines.Add("- `PASS` durumuna gecis icin 07 + 03 checklist maddelerinin tumu kapanmalidir.") | Out-Null

Write-FileWithRetry -Path $latestReportPath -Value $lines
Write-Host ("[PHASE9-CLOSEOUT] latest -> " + $latestReportPath) -ForegroundColor Green
if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotReportPath -Value $lines
  Write-Host ("[PHASE9-CLOSEOUT] snapshot -> " + $snapshotReportPath) -ForegroundColor Green
}

if ($FailOnPartial -and $overallStatus -ne "PASS") {
  exit 6
}
exit 0
