param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$packagesJsonPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$latestRunbookPath = Join-Path $planDir "114_phase9_app_sprint1_execution_latest.md"
$latestSmokeTemplatePath = Join-Path $appImpactDir "14_phase9_app_sprint1_smoke_template_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotRunbookPath = Join-Path $planDir ("114_phase9_app_sprint1_execution_" + $dateSlug + ".md")
$snapshotTemplatePath = Join-Path $planDir ("115_phase9_app_sprint1_smoke_template_" + $dateSlug + ".json")

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
$sprint1 = @($packagesPayload.packages | Where-Object { $_.id -eq "APP-SPRINT-1" })[0]
if ($null -eq $sprint1) {
  throw "APP-SPRINT-1 paketi bulunamadi."
}

$runbook = New-Object System.Collections.Generic.List[string]
$runbook.Add("# Phase 9 APP-SPRINT-1 Execution Runbook") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("Generated At: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$runbook.Add("Source: website/app-impact/12_phase9_app_sprint_packages_latest.json") | Out-Null
$runbook.Add("Package: APP-SPRINT-1") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Scope") | Out-Null
$runbook.Add("- W2A: " + ([string]::Join(", ", @($sprint1.w2a)))) | Out-Null
$runbook.Add("- Open Items: " + [string]$sprint1.open + "/" + [string]$sprint1.total) | Out-Null
$runbook.Add("- Goal: Company context + vehicle/route base parser closure.") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Step-by-Step") | Out-Null
$runbook.Add('1. `createCompany` ve `listMyCompanies` parser alanlarini type-safe parse et.') | Out-Null
$runbook.Add('2. Login sonrasi active company resolver fallback davranisini sabitle.') | Out-Null
$runbook.Add('3. `listCompanyMembers` parser alanlarini role/status/display alanlariyla dogrula.') | Out-Null
$runbook.Add('4. `listCompanyVehicles`, `createVehicle`, `updateVehicle` parser setini kapat.') | Out-Null
$runbook.Add('5. `createCompanyRoute` + `updateCompanyRoute` parser ve token parity akisini dogrula.') | Out-Null
$runbook.Add('6. Her alt adimdan sonra ilgili checklist satirini `07_*` icinde `[x]` yap.') | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Tasks") | Out-Null
foreach ($item in @($sprint1.items)) {
  $mark = if ([bool]$item.done) { "[x]" } else { "[ ]" }
  $runbook.Add("- " + $mark + " " + [string]$item.text) | Out-Null
}
$runbook.Add("") | Out-Null
$runbook.Add("## Acceptance") | Out-Null
foreach ($acc in @($sprint1.acceptance)) {
  $runbook.Add("- " + [string]$acc) | Out-Null
}
$runbook.Add("") | Out-Null
$runbook.Add("## Smoke Evidence Protocol") | Out-Null
$runbook.Add('- Evidence file: `website/app-impact/14_phase9_app_sprint1_smoke_template_latest.json`') | Out-Null
$runbook.Add('- Her test satirinda `pass|fail|blocked` ve kisa not zorunlu.') | Out-Null
$runbook.Add("- Block durumunda endpoint + code + sample payload eklenmeli.") | Out-Null

$smokeTemplate = [pscustomobject]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  package = "APP-SPRINT-1"
  status = "READY"
  source = "website/app-impact/12_phase9_app_sprint_packages_latest.json"
  checks = @(
    @{ id = "S1-01"; name = "createCompany parser"; result = "pending"; note = "" },
    @{ id = "S1-02"; name = "listMyCompanies parser"; result = "pending"; note = "" },
    @{ id = "S1-03"; name = "active company resolver fallback"; result = "pending"; note = "" },
    @{ id = "S1-04"; name = "listCompanyMembers parser"; result = "pending"; note = "" },
    @{ id = "S1-05"; name = "vehicle parser set (list/create/update)"; result = "pending"; note = "" },
    @{ id = "S1-06"; name = "route parser set (create/update + token)"; result = "pending"; note = "" }
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
Write-Host ("[PHASE9-SPRINT1-PACK] latest-runbook -> " + $latestRunbookPath) -ForegroundColor Green

$templateJson = $smokeTemplate | ConvertTo-Json -Depth 8
Write-FileWithRetry -Path $latestSmokeTemplatePath -Value $templateJson
Write-Host ("[PHASE9-SPRINT1-PACK] latest-template -> " + $latestSmokeTemplatePath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotRunbookPath -Value $runbook
  Write-FileWithRetry -Path $snapshotTemplatePath -Value $templateJson
  Write-Host ("[PHASE9-SPRINT1-PACK] snapshot-runbook -> " + $snapshotRunbookPath) -ForegroundColor Green
  Write-Host ("[PHASE9-SPRINT1-PACK] snapshot-template -> " + $snapshotTemplatePath) -ForegroundColor Green
}

exit 0
