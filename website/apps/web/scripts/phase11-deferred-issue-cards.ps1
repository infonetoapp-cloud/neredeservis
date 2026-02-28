param(
  [int]$ChunkSize = 4,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

if ($ChunkSize -lt 1) {
  $ChunkSize = 4
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$sourceJsonPath = Join-Path $appImpactDir "22_phase11_deferred_sprint_packages_latest.json"
$latestMdPath = Join-Path $planDir "144_phase11_deferred_issue_cards_latest.md"
$latestJsonPath = Join-Path $appImpactDir "23_phase11_deferred_issue_cards_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMdPath = Join-Path $planDir ("144_phase11_deferred_issue_cards_" + $dateSlug + ".md")
$snapshotJsonPath = Join-Path $planDir ("145_phase11_deferred_issue_cards_json_" + $dateSlug + ".json")

function Try-WriteFileWithRetry {
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
      return $true
    } catch {
      if ($i -eq $Attempts) {
        return $false
      }
      Start-Sleep -Milliseconds $DelayMs
    }
  }
  return $false
}

if (-not (Test-Path $sourceJsonPath)) {
  throw "Eksik artefact: $sourceJsonPath"
}

$payload = Get-Content -Path $sourceJsonPath -Raw | ConvertFrom-Json
$packages = @($payload.packages)

$cards = New-Object System.Collections.Generic.List[object]
$cardIndex = 1

foreach ($pkg in $packages) {
  $items = @($pkg.items)
  if ($items.Count -eq 0) {
    continue
  }

  for ($i = 0; $i -lt $items.Count; $i += $ChunkSize) {
    $end = [Math]::Min($i + $ChunkSize - 1, $items.Count - 1)
    $chunk = @($items[$i..$end])

    $cardId = "APP-DEF-CARD-" + $cardIndex.ToString("00")
    $itemIds = @($chunk | ForEach-Object { $_.id })
    $title = "[Phase11][" + $pkg.id + "] deferred parity block " + $cardIndex.ToString("00")
    $priority = [string]$pkg.priority

    $cards.Add([pscustomobject]@{
      id = $cardId
      title = $title
      packageId = [string]$pkg.id
      packageTitle = [string]$pkg.title
      priority = $priority
      itemCount = $chunk.Count
      itemIds = $itemIds
      items = $chunk
      doneCriteria = @(
        "Register'da ilgili W2A kalemleri web_done_app_done veya web_done_app_not_required durumuna cekildi.",
        "Ilgili app test/smoke komutlari PASS kaydi ile raporlandi.",
        "Web-app sync reportu tekrar kosuldu ve PASS bozulmadi."
      )
      reportTemplate = @(
        "Degisen dosyalar",
        "Kapanan W2A ID listesi",
        "Kosulan testler + sonuc",
        "Kalan risk/notlar"
      )
    }) | Out-Null

    $cardIndex++
  }
}

$status = if ($cards.Count -gt 0) { "READY" } else { "EMPTY" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 11 Deferred Issue Cards") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("ChunkSize: " + $ChunkSize) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add('- Kaynak paket: `app-impact/22_phase11_deferred_sprint_packages_latest.json`') | Out-Null
$lines.Add("- Toplam kart: " + $cards.Count) | Out-Null
$lines.Add("") | Out-Null

foreach ($card in $cards) {
  $lines.Add("## " + $card.id + " - " + $card.title) | Out-Null
  $lines.Add("- Oncelik: " + $card.priority) | Out-Null
  $lines.Add("- Kaynak paket: " + $card.packageId + " (" + $card.packageTitle + ")") | Out-Null
  $lines.Add("- Kapsam: " + $card.itemCount + " kalem") | Out-Null
  $lines.Add("- W2A IDs: " + ([string]::Join(", ", $card.itemIds))) | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("### Yapilacaklar") | Out-Null
  foreach ($item in $card.items) {
    $trigger = [string]$item.trigger
    if ($trigger.Length -gt 150) {
      $trigger = $trigger.Substring(0, 147) + "..."
    }
    $lines.Add("- [ ] " + [string]$item.id + ": " + $trigger) | Out-Null
  }
  $lines.Add("") | Out-Null
  $lines.Add("### Done Kriterleri") | Out-Null
  $lines.Add('1. Register''da ilgili W2A kalemleri `web_done_app_done` veya `web_done_app_not_required` durumuna cekildi.') | Out-Null
  $lines.Add("2. Ilgili app test/smoke komutlari PASS sonucu ile raporlandi.") | Out-Null
  $lines.Add('3. `npm run readiness:phase11:sync` kosuldu ve PASS durumu korundu.') | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("### Rapor Formati") | Out-Null
  $lines.Add("- Degisen dosyalar: ...") | Out-Null
  $lines.Add("- Kapanan W2A ID listesi: ...") | Out-Null
  $lines.Add("- Kosulan testler + sonuc: ...") | Out-Null
  $lines.Add("- Kalan risk/notlar: ...") | Out-Null
  $lines.Add("") | Out-Null
}

$jsonPayload = [ordered]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  source = "app-impact/22_phase11_deferred_sprint_packages_latest.json"
  chunkSize = $ChunkSize
  cardCount = $cards.Count
  cards = $cards
}

$latestMdOk = Try-WriteFileWithRetry -Path $latestMdPath -Value $lines
if (-not $latestMdOk) {
  Write-Warning ("[PHASE11-DEFERRED-ISSUE-CARDS] latest md lock edildi: " + $latestMdPath)
}

$latestJson = $jsonPayload | ConvertTo-Json -Depth 10
$latestJsonOk = Try-WriteFileWithRetry -Path $latestJsonPath -Value $latestJson
if (-not $latestJsonOk) {
  Write-Warning ("[PHASE11-DEFERRED-ISSUE-CARDS] latest json lock edildi: " + $latestJsonPath)
}

if ($Snapshot) {
  $snapshotMdOk = Try-WriteFileWithRetry -Path $snapshotMdPath -Value $lines
  if (-not $snapshotMdOk) {
    throw ("[PHASE11-DEFERRED-ISSUE-CARDS] snapshot md yazilamadi: " + $snapshotMdPath)
  }

  $snapshotJsonOk = Try-WriteFileWithRetry -Path $snapshotJsonPath -Value $latestJson
  if (-not $snapshotJsonOk) {
    throw ("[PHASE11-DEFERRED-ISSUE-CARDS] snapshot json yazilamadi: " + $snapshotJsonPath)
  }
  Write-Host ("[PHASE11-DEFERRED-ISSUE-CARDS] snapshot-md -> " + $snapshotMdPath) -ForegroundColor Green
  Write-Host ("[PHASE11-DEFERRED-ISSUE-CARDS] snapshot-json -> " + $snapshotJsonPath) -ForegroundColor Green
}

Write-Host ("[PHASE11-DEFERRED-ISSUE-CARDS] latest-md -> " + $latestMdPath) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED-ISSUE-CARDS] latest-json -> " + $latestJsonPath) -ForegroundColor Green

exit 0
