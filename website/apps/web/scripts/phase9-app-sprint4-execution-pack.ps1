param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$packagesJsonPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$latestRunbookPath = Join-Path $planDir "120_phase9_app_sprint4_execution_latest.md"
$latestSmokeTemplatePath = Join-Path $appImpactDir "17_phase9_app_sprint4_smoke_template_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotRunbookPath = Join-Path $planDir ("120_phase9_app_sprint4_execution_" + $dateSlug + ".md")
$snapshotTemplatePath = Join-Path $planDir ("121_phase9_app_sprint4_smoke_template_" + $dateSlug + ".json")

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
$sprint4 = @($packagesPayload.packages | Where-Object { $_.id -eq "APP-SPRINT-4" })[0]
if ($null -eq $sprint4) {
  throw "APP-SPRINT-4 paketi bulunamadi."
}

$runbook = New-Object System.Collections.Generic.List[string]
$runbook.Add("# Phase 9 APP-SPRINT-4 Execution Runbook") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("Generated At: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$runbook.Add("Source: website/app-impact/12_phase9_app_sprint_packages_latest.json") | Out-Null
$runbook.Add("Package: APP-SPRINT-4") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Scope") | Out-Null
$runbook.Add("- W2A: " + ([string]::Join(", ", @($sprint4.w2a)))) | Out-Null
$runbook.Add("- Open Items: " + [string]$sprint4.open + "/" + [string]$sprint4.total) | Out-Null
$runbook.Add("- Goal: Acceptance smoke + cutover checklist closure.") | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Step-by-Step") | Out-Null
$runbook.Add('1. Parser crash-free smoke testini tum callable seti icin kos.') | Out-Null
$runbook.Add('2. Error-code mapping smoke testini zorunlu kod seti icin kos.') | Out-Null
$runbook.Add('3. Company recoverability + route/stop conflict + live fallback senaryolarini dogrula.') | Out-Null
$runbook.Add('4. `03_app_integration_cutover_checklist.md` acik maddelerini tek tek kapat.') | Out-Null
$runbook.Add('5. Smoke template sonucunu `pass|fail|blocked` olarak doldur ve bloklari raporla.') | Out-Null
$runbook.Add("") | Out-Null
$runbook.Add("## Tasks") | Out-Null
foreach ($item in @($sprint4.items)) {
  $mark = if ([bool]$item.done) { "[x]" } else { "[ ]" }
  $runbook.Add("- " + $mark + " " + [string]$item.text) | Out-Null
}
$runbook.Add("") | Out-Null
$runbook.Add("## Acceptance") | Out-Null
foreach ($acc in @($sprint4.acceptance)) {
  $runbook.Add("- " + [string]$acc) | Out-Null
}
$runbook.Add("") | Out-Null
$runbook.Add("## Smoke Evidence Protocol") | Out-Null
$runbook.Add('- Evidence file: `website/app-impact/17_phase9_app_sprint4_smoke_template_latest.json`') | Out-Null
$runbook.Add('- Her test satirinda `pass|fail|blocked` ve kisa not zorunlu.') | Out-Null
$runbook.Add("- Block durumunda endpoint + code + sample payload eklenmeli.") | Out-Null

$smokeTemplate = [pscustomobject]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  package = "APP-SPRINT-4"
  status = "READY"
  source = "website/app-impact/12_phase9_app_sprint_packages_latest.json"
  checks = @(
    @{ id = "S4-01"; name = "parser crash-free smoke"; result = "pending"; note = "" },
    @{ id = "S4-02"; name = "error mapping smoke"; result = "pending"; note = "" },
    @{ id = "S4-03"; name = "company context recoverability"; result = "pending"; note = "" },
    @{ id = "S4-04"; name = "route conflict recoverability"; result = "pending"; note = "" },
    @{ id = "S4-05"; name = "live ops fallback correctness"; result = "pending"; note = "" },
    @{ id = "S4-06"; name = "cutover checklist full closure"; result = "pending"; note = "" }
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
Write-Host ("[PHASE9-SPRINT4-PACK] latest-runbook -> " + $latestRunbookPath) -ForegroundColor Green

$templateJson = $smokeTemplate | ConvertTo-Json -Depth 8
Write-FileWithRetry -Path $latestSmokeTemplatePath -Value $templateJson
Write-Host ("[PHASE9-SPRINT4-PACK] latest-template -> " + $latestSmokeTemplatePath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotRunbookPath -Value $runbook
  Write-FileWithRetry -Path $snapshotTemplatePath -Value $templateJson
  Write-Host ("[PHASE9-SPRINT4-PACK] snapshot-runbook -> " + $snapshotRunbookPath) -ForegroundColor Green
  Write-Host ("[PHASE9-SPRINT4-PACK] snapshot-template -> " + $snapshotTemplatePath) -ForegroundColor Green
}

exit 0
