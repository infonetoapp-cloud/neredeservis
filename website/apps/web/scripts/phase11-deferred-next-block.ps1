param(
  [int]$BlockSize = 4,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

if ($BlockSize -lt 1) {
  $BlockSize = 4
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$registerPath = Join-Path $appImpactDir "00_web_to_app_change_register.md"
$latestMdPath = Join-Path $planDir "148_phase11_deferred_next_block_latest.md"
$latestJsonPath = Join-Path $appImpactDir "25_phase11_deferred_next_block_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMdPath = Join-Path $planDir ("148_phase11_deferred_next_block_" + $dateSlug + ".md")
$snapshotJsonPath = Join-Path $planDir ("149_phase11_deferred_next_block_json_" + $dateSlug + ".json")

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

function PriorityOrder([string]$priority) {
  switch ($priority) {
    "P0" { return 0 }
    "P1" { return 1 }
    "P2" { return 2 }
    "P3" { return 3 }
    "P4" { return 4 }
    default { return 9 }
  }
}

if (-not (Test-Path $registerPath)) {
  throw "Register path not found: $registerPath"
}

$linesRaw = Get-Content -Path $registerPath
$entries = New-Object System.Collections.Generic.List[hashtable]

$current = $null
foreach ($line in $linesRaw) {
  if ($line -match '^###\s+(W2A-\d+)') {
    if ($null -ne $current) {
      $entries.Add($current) | Out-Null
    }
    $current = @{
      id = $matches[1]
      status = ""
      priority = ""
      category = ""
      blocker = ""
      trigger = ""
    }
    continue
  }
  if ($null -eq $current) {
    continue
  }
  if ($line -match '^- (?:`Status`|Status)\s*:\s*`?([^`]+)`?\s*$') {
    $current.status = $matches[1].Trim()
    continue
  }
  if ($line -match '^- (?:`Priority`|Priority)\s*:\s*`?([^`]+)`?\s*$') {
    $current.priority = $matches[1].Trim()
    continue
  }
  if ($line -match '^- (?:`Kategori`|Kategori)\s*:\s*`?([^`]+)`?\s*$') {
    $current.category = $matches[1].Trim()
    continue
  }
  if ($line -match '^- (?:`Bloklayici mi\?`|Bloklayici mi\?)\s*:\s*`?([^`]+)`?\s*$') {
    $current.blocker = $matches[1].Trim()
    continue
  }
  if ($line -match '^- (?:`Web Trigger`|Web Trigger)\s*:\s*(.+)$') {
    $current.trigger = $matches[1].Trim()
    continue
  }
}
if ($null -ne $current) {
  $entries.Add($current) | Out-Null
}

$deferred = @($entries | Where-Object { $_.status -eq "web_done_app_deferred" })
$deferredSorted = @(
  $deferred | Sort-Object @{ Expression = { PriorityOrder($_.priority) } }, @{ Expression = { $_.id } }
)
$nextBlock = @($deferredSorted | Select-Object -First $BlockSize)
$remainingAfterBlock = [Math]::Max(0, $deferredSorted.Count - $nextBlock.Count)
$status = if ($nextBlock.Count -gt 0) { "READY" } else { "EMPTY" }

$md = New-Object System.Collections.Generic.List[string]
$md.Add("# Faz 11 Deferred Next Block") | Out-Null
$md.Add("") | Out-Null
$md.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$md.Add("Durum: " + $status) | Out-Null
$md.Add("BlockSize: " + $BlockSize) | Out-Null
$md.Add("") | Out-Null
$md.Add("## Ozet") | Out-Null
$md.Add("| Metrik | Deger |") | Out-Null
$md.Add("| --- | --- |") | Out-Null
$md.Add("| Deferred toplam | " + $deferredSorted.Count + " |") | Out-Null
$md.Add("| Bu blok kalemi | " + $nextBlock.Count + " |") | Out-Null
$md.Add("| Blok sonrasi kalan | " + $remainingAfterBlock + " |") | Out-Null
$md.Add("| Kaynak | " + (Split-Path $registerPath -Leaf) + " |") | Out-Null
$md.Add("") | Out-Null
$md.Add("## Sonraki 4 Kalem") | Out-Null
$md.Add("| ID | Priority | Kategori | Bloklayici | Web Trigger |") | Out-Null
$md.Add("| --- | --- | --- | --- | --- |") | Out-Null
if ($nextBlock.Count -eq 0) {
  $md.Add("| - | - | - | - | Deferred kalem kalmadi |") | Out-Null
} else {
  foreach ($item in $nextBlock) {
    $trigger = ($item.trigger -replace '\|', '/').Trim()
    if ($trigger.Length -gt 140) {
      $trigger = $trigger.Substring(0, 137) + "..."
    }
    $md.Add("| " + $item.id + " | " + $item.priority + " | " + $item.category + " | " + $item.blocker + " | " + $trigger + " |") | Out-Null
  }
}
$md.Add("") | Out-Null
$md.Add("## Uygulama Akisi (App Sprint Blok)") | Out-Null
$md.Add("1. Bu listedeki kalemleri app tarafinda uygula ve ilgili test/smoke komutlarini calistir.") | Out-Null
$md.Add("2. Her kapanan kalemi register'da `web_done_app_done` veya `web_done_app_not_required` durumuna cek.") | Out-Null
$md.Add("3. npm run readiness:phase11:sync + npm run plan:phase11:deferred-worklist kos ve yeni durumu dogrula.") | Out-Null
$md.Add("4. Sonraki blok icin bu scripti tekrar kos.") | Out-Null

$jsonPayload = [ordered]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  blockSize = $BlockSize
  source = "website/app-impact/00_web_to_app_change_register.md"
  stats = [ordered]@{
    deferredTotal = $deferredSorted.Count
    inBlock = $nextBlock.Count
    remainingAfterBlock = $remainingAfterBlock
  }
  nextBlock = $nextBlock
}

$latestMdOk = Try-WriteFileWithRetry -Path $latestMdPath -Value $md
if (-not $latestMdOk) {
  Write-Warning ("[PHASE11-DEFERRED-NEXT-BLOCK] latest md lock edildi: " + $latestMdPath)
}

$json = $jsonPayload | ConvertTo-Json -Depth 8
$latestJsonOk = Try-WriteFileWithRetry -Path $latestJsonPath -Value $json
if (-not $latestJsonOk) {
  Write-Warning ("[PHASE11-DEFERRED-NEXT-BLOCK] latest json lock edildi: " + $latestJsonPath)
}

if ($Snapshot) {
  $snapshotMdOk = Try-WriteFileWithRetry -Path $snapshotMdPath -Value $md
  if (-not $snapshotMdOk) {
    throw ("[PHASE11-DEFERRED-NEXT-BLOCK] snapshot md yazilamadi: " + $snapshotMdPath)
  }
  $snapshotJsonOk = Try-WriteFileWithRetry -Path $snapshotJsonPath -Value $json
  if (-not $snapshotJsonOk) {
    throw ("[PHASE11-DEFERRED-NEXT-BLOCK] snapshot json yazilamadi: " + $snapshotJsonPath)
  }
  Write-Host ("[PHASE11-DEFERRED-NEXT-BLOCK] snapshot-md -> " + $snapshotMdPath) -ForegroundColor Green
  Write-Host ("[PHASE11-DEFERRED-NEXT-BLOCK] snapshot-json -> " + $snapshotJsonPath) -ForegroundColor Green
}

Write-Host ("[PHASE11-DEFERRED-NEXT-BLOCK] latest-md -> " + $latestMdPath) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED-NEXT-BLOCK] latest-json -> " + $latestJsonPath) -ForegroundColor Green

exit 0
