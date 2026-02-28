param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$executionBoardPath = Join-Path $planDir "121_phase9_app_execution_board_latest.md"
$sprintPackagesPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$runtimeContractPath = Join-Path $appImpactDir "19_app_runtime_behavior_alignment_contract_2026_02_27.md"
$latestPath = Join-Path $planDir "124_phase9_app_daily_checkpoint_latest.md"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPath = Join-Path $planDir ("124_phase9_app_daily_checkpoint_" + $dateSlug + ".md")

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

if (-not (Test-Path $sprintPackagesPath)) {
  throw "Eksik artefact: $sprintPackagesPath"
}

$payload = Get-Content -Path $sprintPackagesPath -Raw | ConvertFrom-Json
$packages = @($payload.packages)
$nextP0 = $packages | Where-Object { $_.priority -eq "P0" -and $_.open -gt 0 } | Select-Object -First 1
$nextP1 = $packages | Where-Object { $_.priority -eq "P1" -and $_.open -gt 0 } | Select-Object -First 1
$totalOpen = [int]$payload.stats.open
$totalDone = [int]$payload.stats.done
$total = [int]$payload.stats.total
$completion = 0
if ($total -gt 0) {
  $completion = [Math]::Round((100.0 * $totalDone) / $total, 1)
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 App Daily Checkpoint") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: PASS") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Gunluk Ozet") | Out-Null
$lines.Add("- Toplam ilerleme: %" + $completion) | Out-Null
$lines.Add("- Toplam acik: " + $totalOpen) | Out-Null
$lines.Add('- Referans board: `website/plan/121_phase9_app_execution_board_latest.md`') | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Bugun Net 4 Adim") | Out-Null
$lines.Add('1. APP-SPRINT-1 parser cekirdeginden en az 3 maddeyi kapat (`create/list company`, `vehicle`, `create/update route`).') | Out-Null
$lines.Add('2. APP-SPRINT-2 route-stop parser akisini (`list/upsert/delete/reorder`) tek blokta kapatmaya basla.') | Out-Null
$lines.Add("3. 426 + token mismatch + soft-lock reason-code mesajlarini app UI map katmaninda netlestir.") | Out-Null
$lines.Add('4. Gun sonu `07` checklist guncelle + smoke kaydi dus + web closeout''u tekrar kos.') | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Siradaki Sprintler") | Out-Null
if ($null -ne $nextP0) {
  $lines.Add("- P0 sonraki: " + [string]$nextP0.id + " (" + [string]$nextP0.open + " acik)") | Out-Null
}
if ($null -ne $nextP1) {
  $lines.Add("- P1 sonraki: " + [string]$nextP1.id + " (" + [string]$nextP1.open + " acik)") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Copy-Paste Komut Seti (Web tarafi rapor guncelleme)") | Out-Null
$lines.Add('```powershell') | Out-Null
$lines.Add("cd website/apps/web") | Out-Null
$lines.Add("npm run plan:phase9:app-sprint-packages") | Out-Null
$lines.Add("npm run board:phase9:app") | Out-Null
$lines.Add("npm run pack:phase9:app-implementation") | Out-Null
$lines.Add("npm run pack:phase9:manual-acceptance") | Out-Null
$lines.Add("npm run closeout:phase9") | Out-Null
$lines.Add('```') | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Referanslar") | Out-Null
$lines.Add('- `website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md`') | Out-Null
$lines.Add('- `website/app-impact/03_app_integration_cutover_checklist.md`') | Out-Null
$lines.Add('- `website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md`') | Out-Null
$lines.Add('- `website/plan/123_phase9_app_implementation_pack_latest.md`') | Out-Null
$lines.Add('- `website/plan/122_phase9_manual_acceptance_pack_latest.md`') | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- Bu checkpoint app tarafinda davranis/kontrat degistirmez; yalnizca gunluk uygulama disiplini verir.") | Out-Null

Write-FileWithRetry -Path $latestPath -Value $lines
Write-Host ("[PHASE9-DAILY-CHECKPOINT] latest -> " + $latestPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotPath -Value $lines
  Write-Host ("[PHASE9-DAILY-CHECKPOINT] snapshot -> " + $snapshotPath) -ForegroundColor Green
}

exit 0
