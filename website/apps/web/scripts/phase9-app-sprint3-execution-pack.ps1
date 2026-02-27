param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$packagesJsonPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$latestRunbookPath = Join-Path $planDir "118_phase9_app_sprint3_execution_latest.md"
$latestSmokeTemplatePath = Join-Path $appImpactDir "16_phase9_app_sprint3_smoke_template_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotRunbookPath = Join-Path $planDir ("118_phase9_app_sprint3_execution_" + $dateSlug + ".md")
$snapshotTemplatePath = Join-Path $planDir ("119_phase9_app_sprint3_smoke_template_" + $dateSlug + ".json")

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
$sprint3 = @($packagesPayload.packages | Where-Object { $_.id -eq "APP-SPRINT-3" })[0]
if ($null -eq $sprint3) {
  throw "APP-SPRINT-3 paketi bulunamadi."
}

$runbook = New-Object System.Collections.Generic.List[string]
$runbook.Add("# Phase 9 APP-SPRINT-3 Execution Runbook") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("Generated At: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$runbook.Add("Source: website/app-impact/12_phase9_app_sprint_packages_latest.json") | Out-Null
$runbook.Add("Package: APP-SPRINT-3") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Scope") | Out-Null
$runbook.Add("- W2A: " + ([string]::Join(", ", @($sprint3.w2a)))) | Out-Null
$runbook.Add("- Open Items: " + [string]$sprint3.open + "/" + [string]$sprint3.total) | Out-Null
$runbook.Add("- Goal: Membership/permission parser + guard error mapping closure.") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Step-by-Step") | Out-Null
$runbook.Add('1. Membership parser setini kapat (`update/invite/accept/decline/remove`).') | Out-Null
$runbook.Add('2. Route permission parser setini kapat (`grant/revoke/list`).') | Out-Null
$runbook.Add('3. Guard error mapping setini kapat (`OWNER_MEMBER_IMMUTABLE`, `SELF_MEMBER_REMOVE_FORBIDDEN`, invite codes).') | Out-Null
$runbook.Add('4. Her alt adimdan sonra `07_*` checklist satirini `[x]` olarak isaretle.') | Out-Null
$runbook.Add('5. Smoke template sonucunu `pass|fail|blocked` olarak doldur.') | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Tasks") | Out-Null
foreach ($item in @($sprint3.items)) {
  $mark = if ([bool]$item.done) { "[x]" } else { "[ ]" }
  $runbook.Add("- " + $mark + " " + [string]$item.text) | Out-Null
}
$runbook.Add("") | Out-Null
$runbook.Add("## Acceptance") | Out-Null
foreach ($acc in @($sprint3.acceptance)) {
  $runbook.Add("- " + [string]$acc) | Out-Null
}
$runbook.Add("") | Out-Null
$runbook.Add("## Smoke Evidence Protocol") | Out-Null
$runbook.Add('- Evidence file: `website/app-impact/16_phase9_app_sprint3_smoke_template_latest.json`') | Out-Null
$runbook.Add('- Her test satirinda `pass|fail|blocked` ve kisa not zorunlu.') | Out-Null
$runbook.Add("- Block durumunda endpoint + code + sample payload eklenmeli.") | Out-Null

$smokeTemplate = [pscustomobject]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  package = "APP-SPRINT-3"
  status = "READY"
  source = "website/app-impact/12_phase9_app_sprint_packages_latest.json"
  checks = @(
    @{ id = "S3-01"; name = "membership parser set"; result = "pending"; note = "" },
    @{ id = "S3-02"; name = "permission parser set"; result = "pending"; note = "" },
    @{ id = "S3-03"; name = "owner/self guard mapping"; result = "pending"; note = "" },
    @{ id = "S3-04"; name = "invite error mapping"; result = "pending"; note = "" },
    @{ id = "S3-05"; name = "route primary guard mapping"; result = "pending"; note = "" }
  )
  blockTemplate = @{
    endpoint = ""
    code = ""
    payloadSample = ""
    expected = ""
    actual = ""
  }
}

Write-FileWithRetry -Path $latestRunbookPath -Value $runbook
Write-Host ("[PHASE9-SPRINT3-PACK] latest-runbook -> " + $latestRunbookPath) -ForegroundColor Green

$templateJson = $smokeTemplate | ConvertTo-Json -Depth 8
Write-FileWithRetry -Path $latestSmokeTemplatePath -Value $templateJson
Write-Host ("[PHASE9-SPRINT3-PACK] latest-template -> " + $latestSmokeTemplatePath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotRunbookPath -Value $runbook
  Write-FileWithRetry -Path $snapshotTemplatePath -Value $templateJson
  Write-Host ("[PHASE9-SPRINT3-PACK] snapshot-runbook -> " + $snapshotRunbookPath) -ForegroundColor Green
  Write-Host ("[PHASE9-SPRINT3-PACK] snapshot-template -> " + $snapshotTemplatePath) -ForegroundColor Green
}

exit 0
