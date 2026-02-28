param(
  [int]$BatchSize = 4,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$packagesPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$latestMdPath = Join-Path $planDir "125_phase9_app_batch_plan_latest.md"
$latestJsonPath = Join-Path $appImpactDir "20_phase9_app_batch_plan_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMdPath = Join-Path $planDir ("125_phase9_app_batch_plan_" + $dateSlug + ".md")

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

if (-not (Test-Path $packagesPath)) {
  throw "Eksik artefact: $packagesPath"
}
if ($BatchSize -lt 1) {
  $BatchSize = 4
}

$payload = Get-Content -Path $packagesPath -Raw | ConvertFrom-Json
$packages = @($payload.packages)

function PriorityRank {
  param([string]$Priority)
  switch ($Priority) {
    "P0" { return 0 }
    "P1" { return 1 }
    default { return 2 }
  }
}

$openItems = New-Object System.Collections.Generic.List[object]
foreach ($pkg in $packages) {
  foreach ($item in $pkg.items | Where-Object { -not $_.done }) {
    $openItems.Add([pscustomobject]@{
      sprint = [string]$pkg.id
      sprintTitle = [string]$pkg.title
      priority = [string]$pkg.priority
      rank = PriorityRank -Priority ([string]$pkg.priority)
      text = [string]$item.text
      w2a = @($pkg.w2a)
    }) | Out-Null
  }
}

$sorted = @($openItems | Sort-Object rank, sprint, text)
$batches = New-Object System.Collections.Generic.List[object]
for ($i = 0; $i -lt $sorted.Count; $i += $BatchSize) {
  $end = [Math]::Min($i + $BatchSize - 1, $sorted.Count - 1)
  $slice = $sorted[$i..$end]
  $batches.Add([pscustomobject]@{
    id = "BATCH-" + (([int]($i / $BatchSize)) + 1)
    size = @($slice).Count
    items = @($slice)
  }) | Out-Null
}

$status = if ($sorted.Count -eq 0) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 App Batch Plan") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add("- Acik toplam item: " + $sorted.Count) | Out-Null
$lines.Add("- Batch boyutu: " + $BatchSize) | Out-Null
$lines.Add("- Uretilen batch sayisi: " + $batches.Count) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ilk 4 Batch (Uygulama Sirasi)") | Out-Null

$limit = [Math]::Min(4, $batches.Count)
if ($limit -eq 0) {
  $lines.Add("- Yok (acik item kalmadi).") | Out-Null
}
for ($b = 0; $b -lt $limit; $b++) {
  $batch = $batches[$b]
  $lines.Add("") | Out-Null
  $lines.Add("### " + [string]$batch.id + " (" + [string]$batch.size + " item)") | Out-Null
  $lines.Add("1. Uygula:") | Out-Null
  $ix = 1
  foreach ($it in $batch.items) {
    $lines.Add("   " + $ix + ". [" + [string]$it.sprint + "][" + [string]$it.priority + "] " + [string]$it.text) | Out-Null
    $ix++
  }
  $lines.Add("2. Kapanis kosulu: ilgili itemler `07` checklist'te [x] olmali.") | Out-Null
  $lines.Add("3. Rapor: degisen dosyalar + test komutlari + acik kalan itemler.") | Out-Null
  $lines.Add("4. Sonra: `npm run closeout:phase9` kos ve deltayi kaydet.") | Out-Null
}

$lines.Add("") | Out-Null
$lines.Add("## Komut Seti") | Out-Null
$lines.Add('```powershell') | Out-Null
$lines.Add("cd website/apps/web") | Out-Null
$lines.Add("npm run plan:phase9:app-sprint-packages") | Out-Null
$lines.Add("npm run plan:phase9:app-batch") | Out-Null
$lines.Add("npm run board:phase9:app") | Out-Null
$lines.Add("npm run closeout:phase9") | Out-Null
$lines.Add('```') | Out-Null

$jsonPayload = [ordered]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  batchSize = $BatchSize
  openTotal = @($sorted).Count
  batchCount = $batches.Count
  batches = $batches
}

Write-FileWithRetry -Path $latestMdPath -Value $lines
Write-FileWithRetry -Path $latestJsonPath -Value ($jsonPayload | ConvertTo-Json -Depth 10)

Write-Host ("[PHASE9-BATCH-PLAN] latest-md -> " + $latestMdPath) -ForegroundColor Green
Write-Host ("[PHASE9-BATCH-PLAN] latest-json -> " + $latestJsonPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotMdPath -Value $lines
  Write-Host ("[PHASE9-BATCH-PLAN] snapshot -> " + $snapshotMdPath) -ForegroundColor Green
}

exit 0
