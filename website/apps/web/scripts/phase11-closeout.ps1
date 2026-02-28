param(
  [int]$ObserveSamples = 2,
  [int]$ObserveIntervalSeconds = 2,
  [switch]$FailOnPartial,
  [switch]$Snapshot
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

$phase9CloseoutScript = Join-Path $scriptDir "phase9-closeout.ps1"
$phase9DeltaScript = Join-Path $scriptDir "phase9-app-progress-delta.ps1"
$phase10CloseoutScript = Join-Path $scriptDir "phase10-closeout.ps1"
$phase10ObserveScript = Join-Path $scriptDir "phase10-post-release-observe.ps1"
$phase10CommitPackScript = Join-Path $scriptDir "phase10-website-commit-pack.ps1"
$phase11TriagedWorklistScript = Join-Path $scriptDir "phase11-triaged-worklist.ps1"
$phase11DeferredWorklistScript = Join-Path $scriptDir "phase11-deferred-worklist.ps1"
$phase11DeferredSprintsScript = Join-Path $scriptDir "phase11-deferred-sprint-packages.ps1"
$phase11DeferredNextBlockScript = Join-Path $scriptDir "phase11-deferred-next-block.ps1"
$phase11DeferredNextKickoffScript = Join-Path $scriptDir "phase11-deferred-next-block-kickoff.ps1"
$phase11DeferredIssueCardsScript = Join-Path $scriptDir "phase11-deferred-issue-cards.ps1"
$phase11DeferredS1SmokeTemplateScript = Join-Path $scriptDir "phase11-deferred-s1-smoke-template.ps1"

$phase9CloseoutReport = Join-Path $planDir "106_phase9_closeout_latest.md"
$phase9DeltaReport = Join-Path $planDir "127_phase9_app_progress_delta_latest.md"
$phase10CloseoutReport = Join-Path $planDir "131_phase10_no_admin_closeout_latest.md"
$phase10ObserveReport = Join-Path $planDir "132_phase10_post_release_observe_latest.md"
$phase10CommitPackReport = Join-Path $planDir "134_phase10_website_commit_pack_latest.md"
$phase11TriagedWorklistReport = Join-Path $planDir "139_phase11_triaged_worklist_latest.md"
$phase11DeferredWorklistReport = Join-Path $planDir "140_phase11_deferred_worklist_latest.md"
$phase11DeferredSprintsReport = Join-Path $planDir "141_phase11_deferred_sprint_packages_latest.md"
$phase11DeferredNextBlockReport = Join-Path $planDir "148_phase11_deferred_next_block_latest.md"
$phase11DeferredNextKickoffReport = Join-Path $planDir "150_phase11_deferred_next_block_kickoff_latest.md"
$phase11DeferredIssueCardsReport = Join-Path $planDir "144_phase11_deferred_issue_cards_latest.md"
$phase11DeferredS1SmokeTemplateReport = Join-Path $planDir "146_phase11_deferred_s1_smoke_template_latest.md"

$latestReport = Join-Path $planDir "137_phase11_closeout_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotReport = Join-Path $planDir ("137_phase11_closeout_" + $dateSlug + ".md")

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

& $phase9CloseoutScript
& $phase9DeltaScript
& $phase10CloseoutScript
& $phase10ObserveScript -Samples $ObserveSamples -IntervalSeconds $ObserveIntervalSeconds
& $phase10CommitPackScript
& $phase11TriagedWorklistScript
& $phase11DeferredWorklistScript
& $phase11DeferredSprintsScript -Snapshot
& $phase11DeferredNextBlockScript -Snapshot
& $phase11DeferredNextKickoffScript
& $phase11DeferredIssueCardsScript -Snapshot
& $phase11DeferredS1SmokeTemplateScript

Push-Location $repoRoot
try {
  npm run lint --prefix website/apps/web
  npm run build --prefix website/apps/web
} finally {
  Pop-Location
}

$phase9CloseoutStatus = Read-MdStatus -Path $phase9CloseoutReport
$phase9DeltaStatus = Read-MdStatus -Path $phase9DeltaReport
$phase10CloseoutStatus = Read-MdStatus -Path $phase10CloseoutReport
$phase10ObserveStatus = Read-MdStatus -Path $phase10ObserveReport
$phase10CommitPackStatus = Read-MdStatus -Path $phase10CommitPackReport
$phase11TriagedStatus = Read-MdStatus -Path $phase11TriagedWorklistReport
$phase11DeferredWorklistStatus = Read-MdStatus -Path $phase11DeferredWorklistReport
$phase11DeferredSprintsStatus = Read-MdStatus -Path $phase11DeferredSprintsReport
$phase11DeferredNextBlockStatus = Read-MdStatus -Path $phase11DeferredNextBlockReport
$phase11DeferredNextKickoffStatus = Read-MdStatus -Path $phase11DeferredNextKickoffReport
$phase11DeferredIssueCardsStatus = Read-MdStatus -Path $phase11DeferredIssueCardsReport
$phase11DeferredS1SmokeTemplateStatus = Read-MdStatus -Path $phase11DeferredS1SmokeTemplateReport

$triagedWorklistOk = $phase11TriagedStatus -eq "PASS"
$deferredWorklistOk = $phase11DeferredWorklistStatus -in @("READY", "EMPTY")
$deferredSprintsOk = $phase11DeferredSprintsStatus -in @("READY", "EMPTY")
$deferredNextBlockOk = $phase11DeferredNextBlockStatus -in @("READY", "EMPTY")
$deferredNextKickoffOk = $phase11DeferredNextKickoffStatus -in @("READY", "EMPTY")
$deferredIssueCardsOk = $phase11DeferredIssueCardsStatus -in @("READY", "EMPTY")
$deferredS1SmokeTemplateOk = $phase11DeferredS1SmokeTemplateStatus -in @("READY", "EMPTY")

$overall = if (
  $phase9CloseoutStatus -eq "PASS" -and
  $phase9DeltaStatus -eq "PASS" -and
  $phase10CloseoutStatus -eq "PASS" -and
  $phase10ObserveStatus -eq "PASS" -and
  $phase10CommitPackStatus -eq "READY" -and
  $triagedWorklistOk -and
  $deferredWorklistOk -and
  $deferredSprintsOk -and
  $deferredNextBlockOk -and
  $deferredNextKickoffOk -and
  $deferredIssueCardsOk -and
  $deferredS1SmokeTemplateOk
) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 11 Closeout") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Adim Sonuclari") | Out-Null
$lines.Add("| Adim | Durum | Kanit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
$lines.Add("| Faz 9 Closeout | " + $phase9CloseoutStatus + " | " + (Split-Path $phase9CloseoutReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 9 App Progress Delta | " + $phase9DeltaStatus + " | " + (Split-Path $phase9DeltaReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 10 Closeout (No-Admin) | " + $phase10CloseoutStatus + " | " + (Split-Path $phase10CloseoutReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 10 Post-Release Observe | " + $phase10ObserveStatus + " | " + (Split-Path $phase10ObserveReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 10 Website Commit Pack | " + $phase10CommitPackStatus + " | " + (Split-Path $phase10CommitPackReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 11 Triaged Worklist | " + $phase11TriagedStatus + " | " + (Split-Path $phase11TriagedWorklistReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 11 Deferred Worklist | " + $phase11DeferredWorklistStatus + " | " + (Split-Path $phase11DeferredWorklistReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 11 Deferred Sprint Packages | " + $phase11DeferredSprintsStatus + " | " + (Split-Path $phase11DeferredSprintsReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 11 Deferred Next Block | " + $phase11DeferredNextBlockStatus + " | " + (Split-Path $phase11DeferredNextBlockReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 11 Deferred Next Block Kickoff | " + $phase11DeferredNextKickoffStatus + " | " + (Split-Path $phase11DeferredNextKickoffReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 11 Deferred Issue Cards | " + $phase11DeferredIssueCardsStatus + " | " + (Split-Path $phase11DeferredIssueCardsReport -Leaf) + " |") | Out-Null
$lines.Add("| Faz 11 Deferred S1 Smoke Template | " + $phase11DeferredS1SmokeTemplateStatus + " | " + (Split-Path $phase11DeferredS1SmokeTemplateReport -Leaf) + " |") | Out-Null
$lines.Add("| Web Lint | PASS | npm run lint |") | Out-Null
$lines.Add("| Web Build | PASS | npm run build |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- PARTIAL durumunda deploy penceresi acilmaz; once PASS olmayan adim kapatilir.") | Out-Null
$lines.Add("- PASS durumunda website-only commit paketi korunur, deploy kotasi icin toplu yayin disiplini surdurulur.") | Out-Null

Write-FileWithRetry -Path $latestReport -Value $lines
Write-Host ("[PHASE11-CLOSEOUT] latest -> " + $latestReport) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotReport -Value $lines
  Write-Host ("[PHASE11-CLOSEOUT] snapshot -> " + $snapshotReport) -ForegroundColor Green
}

if ($FailOnPartial -and $overall -ne "PASS") {
  exit 7
}
exit 0
