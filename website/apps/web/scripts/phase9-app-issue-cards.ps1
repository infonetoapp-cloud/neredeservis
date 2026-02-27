param(
  [int]$CardCount = 6,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$batchJsonPath = Join-Path $appImpactDir "20_phase9_app_batch_plan_latest.json"
$latestMdPath = Join-Path $planDir "126_phase9_app_issue_cards_latest.md"
$latestJsonPath = Join-Path $appImpactDir "21_phase9_app_issue_cards_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMdPath = Join-Path $planDir ("126_phase9_app_issue_cards_" + $dateSlug + ".md")

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

if (-not (Test-Path $batchJsonPath)) {
  throw "Eksik artefact: $batchJsonPath"
}
if ($CardCount -lt 1) {
  $CardCount = 6
}

$payload = Get-Content -Path $batchJsonPath -Raw | ConvertFrom-Json
$batches = @($payload.batches)
$selected = @($batches | Select-Object -First $CardCount)

$cards = New-Object System.Collections.Generic.List[object]
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 App Issue Cards") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: PASS") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add("- Toplam acik item: " + [string]$payload.openTotal) | Out-Null
$lines.Add("- Toplam batch: " + [string]$payload.batchCount) | Out-Null
$lines.Add("- Kart sayisi: " + [string]$selected.Count) | Out-Null

$cardIndex = 1
foreach ($batch in $selected) {
  $cardId = "APP-ISSUE-" + $cardIndex.ToString("00")
  $primary = $null
  if (@($batch.items).Count -gt 0) {
    $primary = $batch.items[0]
  }
  $titleSuffix = if ($null -ne $primary) { [string]$primary.sprint } else { "APP-SPRINT" }
  $title = "[Phase9][" + $titleSuffix + "] " + [string]$batch.id + " parser/mapping closure"
  $priority = if ($null -ne $primary) { [string]$primary.priority } else { "P1" }
  $sprint = if ($null -ne $primary) { [string]$primary.sprint } else { "APP-SPRINT" }

  $checklistItems = New-Object System.Collections.Generic.List[string]
  foreach ($item in $batch.items) {
    $checklistItems.Add([string]$item.text) | Out-Null
  }

  $cards.Add([pscustomobject]@{
    id = $cardId
    title = $title
    sprint = $sprint
    priority = $priority
    sourceBatch = [string]$batch.id
    size = [int]$batch.size
    checklist = $checklistItems
    doneCriteria = @(
      "ilgili parser veya mapping kodu app tarafinda uygulanmis",
      "07 checklist'te bu itemlar [x] olmus",
      "ilgili smoke senaryosu PASS ve kanit eklenmis"
    )
    reportTemplate = @(
      "Degisen dosyalar",
      "Kosulan testler",
      "Kalan aciklar",
      "Risk notu"
    )
  }) | Out-Null

  $lines.Add("") | Out-Null
  $lines.Add("## " + $cardId + " - " + $title) | Out-Null
  $lines.Add("- Oncelik: " + $priority) | Out-Null
  $lines.Add("- Kaynak batch: " + [string]$batch.id) | Out-Null
  $lines.Add("- Kapsam: " + [string]$batch.size + " item") | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("### Amac") | Out-Null
  $lines.Add("- Bu karttaki parser/mapping itemlarini app tarafinda kapatmak.") | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("### Yapilacaklar") | Out-Null
  foreach ($item in $batch.items) {
    $lines.Add("- [ ] " + [string]$item.text) | Out-Null
  }
  $lines.Add("") | Out-Null
  $lines.Add("### Done Kriterleri") | Out-Null
  $lines.Add("1. Ilgili parser/mapping kodu app tarafinda uygulanmis olmali.") | Out-Null
  $lines.Add("2. `website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md` icinde bu maddeler [x] olmali.") | Out-Null
  $lines.Add("3. Smoke sonucu raporlanmali (PASS/FAIL + kanit).") | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("### Rapor Formati") | Out-Null
  $lines.Add("- Degisen dosyalar: ...") | Out-Null
  $lines.Add("- Test komutlari: ...") | Out-Null
  $lines.Add("- Kalan aciklar: ...") | Out-Null
  $lines.Add("- Risk notu: ...") | Out-Null

  $cardIndex++
}

$jsonPayload = [ordered]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = "PASS"
  source = "20_phase9_app_batch_plan_latest.json"
  cardCount = $selected.Count
  cards = $cards
}

Write-FileWithRetry -Path $latestMdPath -Value $lines
Write-FileWithRetry -Path $latestJsonPath -Value ($jsonPayload | ConvertTo-Json -Depth 10)

Write-Host ("[PHASE9-ISSUE-CARDS] latest-md -> " + $latestMdPath) -ForegroundColor Green
Write-Host ("[PHASE9-ISSUE-CARDS] latest-json -> " + $latestJsonPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotMdPath -Value $lines
  Write-Host ("[PHASE9-ISSUE-CARDS] snapshot -> " + $snapshotMdPath) -ForegroundColor Green
}

exit 0
