param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$packagesJsonPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$latestPromptPath = Join-Path $planDir "113_phase9_app_kickoff_prompt_latest.md"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPromptPath = Join-Path $planDir ("113_phase9_app_kickoff_prompt_" + $dateSlug + ".md")

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

if (-not (Test-Path $packagesJsonPath)) {
  throw "Sprint packages JSON bulunamadi: $packagesJsonPath"
}

$packagesPayload = Get-Content -Path $packagesJsonPath -Raw | ConvertFrom-Json
$packages = @($packagesPayload.packages)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Phase 9 App Kickoff Prompt") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Generated At: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Source: website/app-impact/12_phase9_app_sprint_packages_latest.json") | Out-Null
$lines.Add("Status: " + [string]$packagesPayload.status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Objective") | Out-Null
$lines.Add("- Close app parser/mapping backlog without changing web contracts.") | Out-Null
$lines.Add("- Execute packages in strict order: APP-SPRINT-1 -> 2 -> 3 -> 4.") | Out-Null
$lines.Add("- Update checklist truth source after each package: `website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md`.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Rules") | Out-Null
$lines.Add("1. Do not change callable request/response contracts; parser and UI mapping only.") | Out-Null
$lines.Add("2. Keep error-code mapping deterministic and user-facing copy actionable.") | Out-Null
$lines.Add("3. After each package, run smoke and mark checklist items `[x]` only if verified.") | Out-Null
$lines.Add("4. If any package blocks on backend behavior, log exact endpoint/code and stop there.") | Out-Null
$lines.Add("") | Out-Null

foreach ($pkg in $packages) {
  $lines.Add("## " + [string]$pkg.id + " - " + [string]$pkg.title) | Out-Null
  $lines.Add("- Priority: " + [string]$pkg.priority) | Out-Null
  $lines.Add("- Open: " + [string]$pkg.open + "/" + [string]$pkg.total) | Out-Null
  $lines.Add("- W2A Scope: " + ([string]::Join(", ", @($pkg.w2a)))) | Out-Null
  $lines.Add("- Tasks:") | Out-Null
  foreach ($item in @($pkg.items)) {
    $mark = if ([bool]$item.done) { "[x]" } else { "[ ]" }
    $lines.Add("  - " + $mark + " " + [string]$item.text) | Out-Null
  }
  $lines.Add("- Acceptance:") | Out-Null
  foreach ($acc in @($pkg.acceptance)) {
    $lines.Add("  - " + [string]$acc) | Out-Null
  }
  $lines.Add("") | Out-Null
}

$lines.Add("## Mandatory Output After Each Package") | Out-Null
$lines.Add('- Updated checklist diff (`07_*`).') | Out-Null
$lines.Add("- Short smoke log (what passed/failed).") | Out-Null
$lines.Add("- If blocked: endpoint + code + payload sample + expected vs actual.") | Out-Null

Write-FileWithRetry -Path $latestPromptPath -Value $lines
Write-Host ("[PHASE9-KICKOFF-PROMPT] latest -> " + $latestPromptPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotPromptPath -Value $lines
  Write-Host ("[PHASE9-KICKOFF-PROMPT] snapshot -> " + $snapshotPromptPath) -ForegroundColor Green
}

exit 0
