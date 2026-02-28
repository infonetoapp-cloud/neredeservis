param(
  [switch]$FailOnDeferred
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$registerPath = Join-Path $appImpactDir "00_web_to_app_change_register.md"
$latestReport = Join-Path $planDir "140_phase11_deferred_worklist_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotReport = Join-Path $planDir ("140_phase11_deferred_worklist_" + $dateSlug + ".md")

function Write-FileWithRetry {
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
$deferredCount = $deferred.Count
$deferredSorted = @(
  $deferred |
    Sort-Object @{ Expression = { PriorityOrder($_.priority) } }, @{ Expression = { $_.id } }
)

$priorityCounts = @{}
foreach ($item in $deferredSorted) {
  $key = $item.priority
  if ([string]::IsNullOrWhiteSpace($key)) {
    $key = "UNSET"
  }
  if (-not $priorityCounts.ContainsKey($key)) {
    $priorityCounts[$key] = 0
  }
  $priorityCounts[$key]++
}

$summaryByPriority = @(
  $priorityCounts.GetEnumerator() |
    Sort-Object @{ Expression = { PriorityOrder($_.Key) } }, @{ Expression = { $_.Key } }
)

$overall = if ($deferredCount -eq 0) { "EMPTY" } else { "READY" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 11 Deferred App Worklist") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add("| Metrik | Deger |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
$lines.Add("| Deferred kayit | " + $deferredCount + " |") | Out-Null
$lines.Add("| Kaynak | " + (Split-Path $registerPath -Leaf) + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Priority Dagilimi") | Out-Null
$lines.Add("| Priority | Adet |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
if ($summaryByPriority.Count -eq 0) {
  $lines.Add("| - | 0 |") | Out-Null
} else {
  foreach ($bucket in $summaryByPriority) {
    $lines.Add("| " + $bucket.Key + " | " + $bucket.Value + " |") | Out-Null
  }
}
$lines.Add("") | Out-Null
$lines.Add("## Deferred Kalemler") | Out-Null
$lines.Add("| ID | Priority | Kategori | Bloklayici | Web Trigger |") | Out-Null
$lines.Add("| --- | --- | --- | --- | --- |") | Out-Null

if ($deferredCount -eq 0) {
  $lines.Add("| - | - | - | - | Deferred kayit yok |") | Out-Null
} else {
  foreach ($item in $deferredSorted) {
    $trigger = ($item.trigger -replace '\|', '/').Trim()
    if ($trigger.Length -gt 120) {
      $trigger = $trigger.Substring(0, 117) + "..."
    }
    $lines.Add("| " + $item.id + " | " + $item.priority + " | " + $item.category + " | " + $item.blocker + " | " + $trigger + " |") | Out-Null
  }
}

$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- Deferred backlog release blocker degildir; app sprint kapasitesine gore blok bazli kapatilir.") | Out-Null
$lines.Add("- Kapanan her deferred kalem register'da `web_done_app_done` veya `web_done_app_not_required` durumuna cekilmelidir.") | Out-Null

$latestOk = Write-FileWithRetry -Path $latestReport -Value $lines
if (-not $latestOk) {
  Write-Warning ("[PHASE11-DEFERRED] latest file lock edildi: " + $latestReport)
}

$snapshotOk = Write-FileWithRetry -Path $snapshotReport -Value $lines
if (-not $snapshotOk) {
  throw ("[PHASE11-DEFERRED] snapshot yazilamadi: " + $snapshotReport)
}

Write-Host ("[PHASE11-DEFERRED] latest -> " + $latestReport) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED] snapshot -> " + $snapshotReport) -ForegroundColor Green

if ($FailOnDeferred -and $deferredCount -gt 0) {
  exit 7
}
exit 0
