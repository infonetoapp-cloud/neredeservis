param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$issueCardsJsonPath = Join-Path $appImpactDir "23_phase11_deferred_issue_cards_latest.json"
$latestMdPath = Join-Path $planDir "146_phase11_deferred_s1_smoke_template_latest.md"
$latestJsonPath = Join-Path $appImpactDir "24_phase11_deferred_s1_smoke_template_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMdPath = Join-Path $planDir ("146_phase11_deferred_s1_smoke_template_" + $dateSlug + ".md")
$snapshotJsonPath = Join-Path $planDir ("147_phase11_deferred_s1_smoke_template_json_" + $dateSlug + ".json")

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

if (-not (Test-Path $issueCardsJsonPath)) {
  throw "Eksik artefact: $issueCardsJsonPath"
}

$payload = Get-Content -Path $issueCardsJsonPath -Raw | ConvertFrom-Json
$cards = @($payload.cards)
$s1Card = $cards | Where-Object { $_.packageId -eq "APP-DEFERRED-S1" } | Select-Object -First 1

$status = if ($null -eq $s1Card) { "EMPTY" } else { "READY" }
$checklist = if ($null -eq $s1Card) {
  @()
} else {
  @(
    "App acilisinda canonical host link acma akisi (app.neredeservis.app) sorun cikarmiyor.",
    "Deep-link/WebView allowlist policy canonical hostu kabul ediyor.",
    "Force-update/version gate ile canonical host davranisi birbiriyle cakismiyor.",
    "W2A-446 register durumu app implementasyon sonrasi guncelleniyor.",
    "Ilgili app test komutlari PASS olarak raporlandi."
  )
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 11 Deferred S1 Smoke Template") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
if ($status -eq "EMPTY") {
  $lines.Add("## Kapsam") | Out-Null
  $lines.Add("- APP-DEFERRED-S1 paketi bu kosumda bulunmadi.") | Out-Null
  $lines.Add("- Deferred issue card dagilimi S2/S3 odakli oldugu icin S1 smoke template olusturulmadi.") | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("## Sonuc") | Out-Null
  $lines.Add("- Durum: EMPTY (aksiyon gerekmiyor)") | Out-Null
} else {
  $lines.Add("## Kapsam") | Out-Null
  $lines.Add("- Kart: " + [string]$s1Card.id) | Out-Null
  $lines.Add("- Paket: APP-DEFERRED-S1") | Out-Null
  $lines.Add("- W2A IDs: " + ([string]::Join(", ", @($s1Card.itemIds)))) | Out-Null
  $lines.Add("") | Out-Null
  $lines.Add("## Smoke Checklist") | Out-Null
  foreach ($item in $checklist) {
    $lines.Add("- [ ] " + $item) | Out-Null
  }
  $lines.Add("") | Out-Null
  $lines.Add("## Sonuc Formati") | Out-Null
  $lines.Add("- Sonuc: PASS | PARTIAL | FAIL") | Out-Null
  $lines.Add("- Komutlar: ...") | Out-Null
  $lines.Add("- Kanit dosyalari: ...") | Out-Null
  $lines.Add("- Notlar/Riskler: ...") | Out-Null
}

$jsonPayload = [ordered]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  source = "app-impact/23_phase11_deferred_issue_cards_latest.json"
  cardId = if ($null -eq $s1Card) { $null } else { [string]$s1Card.id }
  packageId = "APP-DEFERRED-S1"
  w2aIds = if ($null -eq $s1Card) { @() } else { @($s1Card.itemIds) }
  checklist = $checklist
}

$latestMdOk = Try-WriteFileWithRetry -Path $latestMdPath -Value $lines
if (-not $latestMdOk) {
  Write-Warning ("[PHASE11-DEFERRED-S1-SMOKE] latest md lock edildi: " + $latestMdPath)
}

$latestJson = $jsonPayload | ConvertTo-Json -Depth 8
$latestJsonOk = Try-WriteFileWithRetry -Path $latestJsonPath -Value $latestJson
if (-not $latestJsonOk) {
  Write-Warning ("[PHASE11-DEFERRED-S1-SMOKE] latest json lock edildi: " + $latestJsonPath)
}

$snapshotMdOk = Try-WriteFileWithRetry -Path $snapshotMdPath -Value $lines
if (-not $snapshotMdOk) {
  throw ("[PHASE11-DEFERRED-S1-SMOKE] snapshot md yazilamadi: " + $snapshotMdPath)
}

$snapshotJsonOk = Try-WriteFileWithRetry -Path $snapshotJsonPath -Value $latestJson
if (-not $snapshotJsonOk) {
  throw ("[PHASE11-DEFERRED-S1-SMOKE] snapshot json yazilamadi: " + $snapshotJsonPath)
}

Write-Host ("[PHASE11-DEFERRED-S1-SMOKE] latest-md -> " + $latestMdPath) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED-S1-SMOKE] latest-json -> " + $latestJsonPath) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED-S1-SMOKE] snapshot-md -> " + $snapshotMdPath) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED-S1-SMOKE] snapshot-json -> " + $snapshotJsonPath) -ForegroundColor Green

exit 0
