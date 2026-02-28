param(
  [switch]$FailOnTriaged
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$registerPath = Join-Path $appImpactDir "00_web_to_app_change_register.md"
$latestReport = Join-Path $planDir "139_phase11_triaged_worklist_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotReport = Join-Path $planDir ("139_phase11_triaged_worklist_" + $dateSlug + ".md")

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
      return
    } catch {
      if ($i -eq $Attempts) {
        throw
      }
      Start-Sleep -Milliseconds $DelayMs
    }
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
    $current.status = $matches[1]
    continue
  }
  if ($line -match '^- (?:`Priority`|Priority)\s*:\s*`?([^`]+)`?\s*$') {
    $current.priority = $matches[1]
    continue
  }
  if ($line -match '^- (?:`Kategori`|Kategori)\s*:\s*`?([^`]+)`?\s*$') {
    $current.category = $matches[1]
    continue
  }
  if ($line -match '^- (?:`Bloklayici mi\?`|Bloklayici mi\?)\s*:\s*`?([^`]+)`?\s*$') {
    $current.blocker = $matches[1]
    continue
  }
  if ($line -match '^- (?:`Web Trigger`|Web Trigger)\s*:\s*(.+)$') {
    $current.trigger = $matches[1]
    continue
  }
}

if ($null -ne $current) {
  $entries.Add($current) | Out-Null
}

$triaged = @($entries | Where-Object { $_.status -eq "triaged" })
$triagedCount = $triaged.Count

function PriorityOrder([string]$priority) {
  switch ($priority) {
    "P0" { return 0 }
    "P1" { return 1 }
    "P2" { return 2 }
    "P3" { return 3 }
    default { return 9 }
  }
}

$triagedSorted = @($triaged | Sort-Object @{ Expression = { PriorityOrder($_.priority) } }, @{ Expression = { $_.id } })
$overall = if ($triagedCount -eq 0) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 11 Triaged Worklist") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add("| Metrik | Deger |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
$lines.Add("| Triaged kayit | " + $triagedCount + " |") | Out-Null
$lines.Add("| Kaynak | " + (Split-Path $registerPath -Leaf) + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Triaged Kalemler") | Out-Null
$lines.Add("| ID | Priority | Kategori | Bloklayici | Web Trigger |") | Out-Null
$lines.Add("| --- | --- | --- | --- | --- |") | Out-Null

if ($triagedCount -eq 0) {
  $lines.Add("| - | - | - | - | Triaged kayit yok |") | Out-Null
} else {
  foreach ($item in $triagedSorted) {
    $trigger = ($item.trigger -replace '\|', '/').Trim()
    if ($trigger.Length -gt 120) {
      $trigger = $trigger.Substring(0, 117) + "..."
    }
    $lines.Add("| " + $item.id + " | " + $item.priority + " | " + $item.category + " | " + $item.blocker + " | " + $trigger + " |") | Out-Null
  }
}

$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- Triaged kalemler phase closure'a blok koymaz; ancak sync tam kapanis icin `web_done_app_done` veya `web_done_app_not_required` durumuna cekilmelidir.") | Out-Null
$lines.Add("- Bu liste bir sonraki blokta 4'erli closure sprintleri icin is emri kaynagi olarak kullanilir.") | Out-Null

Write-FileWithRetry -Path $latestReport -Value $lines
Write-Host ("[PHASE11-TRIAGED] latest -> " + $latestReport) -ForegroundColor Green

Write-FileWithRetry -Path $snapshotReport -Value $lines
Write-Host ("[PHASE11-TRIAGED] snapshot -> " + $snapshotReport) -ForegroundColor Green

if ($FailOnTriaged -and $triagedCount -gt 0) {
  exit 7
}
exit 0
